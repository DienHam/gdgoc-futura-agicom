/* =====================================================================
   AGICOM API INTEGRATION v2.0
   Kết nối Frontend Dashboard với FastAPI Backend

   File này được load SAU app4.js và ghi đè các hàm cần thiết
   để tích hợp các tính năng thực tế của backend.

   Backend endpoints được tích hợp:
   - POST /chat-v3                 → Live Chat với AI (RAG + lịch sử hội thoại)
   - GET  /api/reviews             → Lấy reviews từ database
   - POST /learn-from-review       → Gửi review để AI học hỏi
   - GET  /daily-summary           → Tóm tắt AI hàng ngày
   - POST /export-daily-summary    → Xuất & lưu trữ báo cáo ngày
   - POST /slow-track-strategy     → Phân tích chiến lược giá
   - POST /act-and-learn           → Phê duyệt / từ chối đề xuất AI
   - GET  /api/chatbot/features    → Danh sách tính năng chatbot
   - GET  /api/quality/overview    → Tổng quan chất lượng AI
   - DELETE /chat/{id}             → Xóa lịch sử chat
   - POST /system/reset-all        → Reset toàn bộ dữ liệu
   ===================================================================== */

/* ──────────────────────────────────────────────────────────────────────
   1. CONFIGURATION
   ────────────────────────────────────────────────────────────────────── */

// ⚠️ Đổi URL này nếu backend chạy ở port khác hoặc địa chỉ khác
const API_BASE = window.AGICOM_API_BASE || 'http://localhost:8000';

let _backendConnected = false;

/* ──────────────────────────────────────────────────────────────────────
   CHAT SESSION STATS — Theo dõi realtime trong phiên làm việc
   ────────────────────────────────────────────────────────────────────── */
const chatSessionStats = {
  totalUserMsgs: 0,      // Tổng tin nhắn từ khách
  totalAIReplies: 0,     // Tổng phản hồi AI
  totalSafe: 0,          // Số lượng tự động gửi (safe)
  totalEscalated: 0,     // Số lượng chờ duyệt (escalated)
  confidenceScores: [],  // Mảng confidence để tính trung bình
  sentiments: [],        // Mảng sentiment strings
  startTime: null,       // Thời điểm bắt đầu session
  avgResponseMs: [],     // Thời gian phản hồi (ms)

  reset() {
    this.totalUserMsgs = 0;
    this.totalAIReplies = 0;
    this.totalSafe = 0;
    this.totalEscalated = 0;
    this.confidenceScores = [];
    this.sentiments = [];
    this.startTime = null;
    this.avgResponseMs = [];
  },

  avgConfidence() {
    if (!this.confidenceScores.length) return 0;
    return Math.round(this.confidenceScores.reduce((a, b) => a + b, 0) / this.confidenceScores.length * 100);
  },

  sentimentCounts() {
    const counts = { positive: 0, neutral: 0, negative: 0 };
    this.sentiments.forEach(s => {
      const lower = (s || '').toLowerCase();
      if (lower.includes('tích cực') || lower.includes('positive') || lower.includes('hài lòng') || lower.includes('vui')) counts.positive++;
      else if (lower.includes('tiêu cực') || lower.includes('negative') || lower.includes('bức xúc') || lower.includes('tức') || lower.includes('phàn nàn')) counts.negative++;
      else counts.neutral++;
    });
    return counts;
  },

  safeRate() {
    if (!this.totalAIReplies) return 100;
    return Math.round(this.totalSafe / this.totalAIReplies * 100);
  },

  sessionDuration() {
    if (!this.startTime) return '—';
    const diff = Math.floor((Date.now() - this.startTime) / 1000);
    if (diff < 60) return `${diff}s`;
    return `${Math.floor(diff / 60)}m ${diff % 60}s`;
  },

  avgResponse() {
    if (!this.avgResponseMs.length) return '—';
    return Math.round(this.avgResponseMs.reduce((a, b) => a + b, 0) / this.avgResponseMs.length) + 'ms';
  }
};

/* ──────────────────────────────────────────────────────────────────────
   2. API HELPER
   ────────────────────────────────────────────────────────────────────── */

async function apiCall(endpoint, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(API_BASE + endpoint, opts);
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(`HTTP ${res.status}: ${errText}`);
  }
  return res.json();
}

/* ──────────────────────────────────────────────────────────────────────
   3. HEALTH CHECK — Kiểm tra kết nối khi trang tải
   ────────────────────────────────────────────────────────────────────── */

async function checkBackendHealth() {
  try {
    const data = await apiCall('/health');
    if (data.status === 'healthy') {
      _backendConnected = true;
      showToast('🟢 Backend kết nối thành công! Tất cả tính năng AI đang hoạt động.', 'success');
      // Cập nhật indicator ở header
      const indicator = document.getElementById('backendStatusIndicator');
      if (indicator) {
        indicator.textContent = '🟢 Backend Online';
        indicator.style.color = 'var(--accent-emerald)';
      }
    }
  } catch (err) {
    _backendConnected = false;
    showToast('🟡 Backend chưa kết nối — Đang chạy chế độ Demo (dữ liệu mẫu)', 'warning');
    console.warn('[Agicom] Backend không khả dụng:', err.message);
    const indicator = document.getElementById('backendStatusIndicator');
    if (indicator) {
      indicator.textContent = '🔴 Backend Offline (Demo Mode)';
      indicator.style.color = 'var(--accent-rose)';
    }
  }
}

/* ──────────────────────────────────────────────────────────────────────
   4. SCAN THỊ TRƯỜNG — Gọi /slow-track-strategy
   ────────────────────────────────────────────────────────────────────── */

// Lưu bản gốc
const _origRunScan = typeof runScan === 'function' ? runScan : null;

runScan = async function () {
  const overlay = document.getElementById('scanOverlay');
  const btn = document.getElementById('btnScan');
  if (overlay) overlay.classList.add('show');
  if (btn) btn.classList.add('scanning');

  try {
    // Đọc chỉ thị từ guidance toolbar nếu có
    const directive =
      document.getElementById('guidanceActiveCmdText')?.textContent?.trim() ||
      'Không có chỉ thị đặc biệt';

    const result = await apiCall('/slow-track-strategy', 'POST', {
      product_id: 'S24-ULTRA-001',
      product_name: 'Samsung Galaxy S24 Ultra',
      internal_data: {
        current_price: 29990000,
        stock_level: 12,
        cost_price: 26000000,
        min_margin_percent: 8,
        conversion_rate: 0.05,
      },
      market_data: {
        competitor_min_price: 28490000,
        market_trend: 'Đối thủ giảm giá mạnh tuần này',
        competitor_name: 'Hoàng Hà',
        competitor_rating: 4.5,
        our_rating: 4.8,
        platform_campaign: 'None',
      },
      customer_context: {
        recent_sentiment: 'phân vân',
        frequent_question: 'Pin S24 Ultra dùng được bao lâu?',
      },
      shop_profile: {
        target_customers:
          'Học sinh sinh viên, nhân viên văn phòng yêu công nghệ, thu nhập 8-25 triệu/tháng',
        strategic_vision: 'Tối ưu lợi nhuận dài hạn, cạnh tranh về chất lượng dịch vụ',
        brand_tone: 'Chuyên nghiệp, nhiệt tình',
      },
      manager_directive: directive,
    });

    if (overlay) overlay.classList.remove('show');
    if (btn) btn.classList.remove('scanning');

    if (result && result.data) {
      const d = result.data;
      const newSug = {
        id: result.proposal_id || 'sug-live-' + Date.now(),
        type: 'price',
        status: 'pending',
        time: 'Vừa xong',
        title: d.action_required
          ? `[AI LIVE] Đề xuất giá mới: ${d.proposed_price?.toLocaleString('vi-VN')}đ`
          : '[AI LIVE] Giữ nguyên giá — thị trường ổn định',
        reason:
          d.pricing_reasoning ||
          (d.content_update_suggestion
            ? `Gợi ý nội dung: ${d.content_update_suggestion}`
            : 'AI đã phân tích toàn diện và đưa ra khuyến nghị.'),
        metrics: [
          { label: 'Margin dự kiến', value: (d.expected_margin_percent || 0) + '%' },
          { label: 'Trạng thái', value: d.action_required ? '⚠ Cần thay đổi' : '✅ Ổn định' },
          { label: 'Mức độ khẩn', value: d.urgency_level || 'Trung bình' },
        ],
        confidence: 92,
      };

      // Thêm vào đầu danh sách suggestions
      MOCK.suggestions.unshift(newSug);

      showToast(
        '✅ Quét hoàn tất! Gemini AI đã phân tích và tạo đề xuất mới (LIVE) → xem trang Đề xuất AI',
        'success'
      );

      // Nếu đang ở trang ai-suggestions thì cập nhật luôn
      if (typeof currentPage !== 'undefined' && currentPage === 'ai-suggestions') {
        setTimeout(() => navigate('ai-suggestions'), 600);
      }
    } else {
      showToast('Quét hoàn tất! AI không cần thay đổi gì lúc này.', 'info');
    }
  } catch (err) {
    if (overlay) overlay.classList.remove('show');
    if (btn) btn.classList.remove('scanning');

    // Fallback: Demo mode
    console.warn('[Agicom] Scan API lỗi, chạy demo:', err.message);
    setTimeout(() => {
      showToast('Quét hoàn tất (Demo Mode — Backend chưa kết nối)', 'warning');
    }, 200);
  }
};

/* ──────────────────────────────────────────────────────────────────────
   5. REVIEWS — /api/reviews + /learn-from-review
   ────────────────────────────────────────────────────────────────────── */

async function loadReviewsFromAPI() {
  try {
    const data = await apiCall('/api/reviews?limit=20');
    if (data && data.data && data.data.length > 0) {
      const dbReviews = data.data.map((r) => ({
        author: r.customer_name || 'Ẩn danh',
        date: new Date(r.timestamp).toLocaleDateString('vi-VN'),
        rating: r.rating,
        text: r.review_text,
        tag:
          r.rating >= 4
            ? { type: 'pos', label: r.ai_insight || 'Phản hồi tích cực' }
            : { type: 'neg', label: r.ai_insight || 'Cần cải thiện' },
        fromDB: true,
      }));

      // Gộp: DB reviews đứng đầu, sau đó mock reviews
      MOCK.reviews = [...dbReviews, ...MOCK.reviews.filter((r) => !r.fromDB)];

      showToast(`📥 Đã tải ${data.total_fetched} review từ database`, 'info');

      // Re-render nếu đang ở trang reviews (dùng _origNavigate để tránh vòng lặp)
      if (typeof currentPage !== 'undefined' && currentPage === 'reviews') {
        _origNavigate('reviews');
        setTimeout(injectReviewForm, 80);
      }
    } else {
      showToast('Chưa có review nào trong database (dùng form bên dưới để thêm)', 'info');
    }
  } catch (err) {
    showToast('Không thể tải reviews từ backend: ' + err.message, 'warning');
    console.warn('[Agicom] Reviews API lỗi:', err.message);
  }
}

async function submitReviewToAPI(formData) {
  // Sync ngay vào MOCK để Crisis panel luôn có dữ liệu (kể cả khi backend offline)
  _syncReviewToMock(formData);

  try {
    const result = await apiCall('/learn-from-review', 'POST', formData);
    showToast('✅ Review đã gửi! AI đang phân tích và học hỏi từ dữ liệu này.', 'success');
    setTimeout(loadReviewsFromAPI, 1500);
    // Nếu review tiêu cực → nhắc chuyển sang Crisis Center
    if (parseInt(formData.rating) <= 3) {
      setTimeout(() => _alertCrisisFromReview(formData), 1800);
    }
    return result;
  } catch (err) {
    // Kể cả backend offline, MOCK đã được cập nhật — vẫn thông báo thành công cho demo
    if (parseInt(formData.rating) <= 3) {
      showToast('🔴 Review tiêu cực đã ghi nhận (Demo) — kiểm tra Quản trị Khủng hoảng!', 'danger');
      setTimeout(() => _alertCrisisFromReview(formData), 600);
    } else {
      showToast('✅ Review đã lưu (Demo Mode — Backend offline)', 'info');
    }
  }
}

/** Thêm review vào MOCK.reviews ngay lập tức (không cần backend). */
function _syncReviewToMock(formData) {
  if (typeof MOCK === 'undefined') return;
  const rating = parseInt(formData.rating) || 3;
  const tagLabel = rating <= 1 ? 'Chất lượng SP'
                 : rating <= 2 ? 'Phản hồi tiêu cực'
                 : rating <= 3 ? 'Cần cải thiện'
                 : 'Phản hồi tích cực';
  const review = {
    author: formData.customer_name || 'Khách Demo',
    date: 'Vừa xong',
    rating,
    text: formData.review_text || '',
    product_id: formData.product_id || 'General',
    tag: { type: rating <= 3 ? 'neg' : 'pos', label: tagLabel },
    _isDemo: true
  };
  // Thay thế review demo cũ cùng sản phẩm để không trùng lặp
  MOCK.reviews = MOCK.reviews.filter(r => !(r._isDemo && r.product_id === review.product_id));
  MOCK.reviews.unshift(review);
}

/** Hiển thị toast + banner sau khi có review tiêu cực. */
function _alertCrisisFromReview(formData) {
  const pid = formData.product_id || 'sản phẩm';
  // Toast với nút bấm điều hướng
  const toastId = 'toast_crisis_' + Date.now();
  const toastEl = document.createElement('div');
  toastEl.id = toastId;
  toastEl.style.cssText = `
    position:fixed;bottom:80px;right:20px;z-index:9999;
    background:#1e1b4b;border:2px solid #ef4444;border-radius:12px;
    padding:12px 16px;max-width:340px;box-shadow:0 8px 32px rgba(0,0,0,0.4);
    animation:slideInRight 0.3s ease;`;
  toastEl.innerHTML = `
    <div style="font-size:0.8rem;font-weight:700;color:#ef4444;margin-bottom:6px;">
      🔴 Review tiêu cực đã được ghi nhận!
    </div>
    <div style="font-size:0.75rem;color:#c7d2fe;margin-bottom:10px;line-height:1.5;">
      Sản phẩm <strong>${pid}</strong> nhận đánh giá ⭐${formData.rating}/5 — AI đã phân tích và cập nhật vào hệ thống cảnh báo.
    </div>
    <div style="display:flex;gap:8px;">
      <button onclick="navigate('crisis-center');document.getElementById('${toastId}')?.remove();"
        style="flex:1;font-size:0.75rem;padding:6px;border-radius:8px;background:#ef4444;
          color:white;border:none;cursor:pointer;font-weight:700;">
        🛡 Xem Quản trị Khủng hoảng
      </button>
      <button onclick="document.getElementById('${toastId}')?.remove();"
        style="font-size:0.75rem;padding:6px 10px;border-radius:8px;border:1px solid #6366f1;
          background:transparent;color:#a5b4fc;cursor:pointer;">
        ✕
      </button>
    </div>`;
  document.body.appendChild(toastEl);
  setTimeout(() => toastEl?.remove(), 12000);
}

/* ──────────────────────────────────────────────────────────────────────
   6. LIVE CHAT — /chat-v3
   ────────────────────────────────────────────────────────────────────── */

let liveChatCustomerId =
  'demo_customer_' + Math.random().toString(36).substring(2, 8);

function buildLiveChatWidgetHTML() {
  return `
    <div class="content-card" style="margin-top:20px;border:2px solid var(--accent-emerald);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
        <div>
          <div class="content-card-title" style="margin:0;color:var(--accent-emerald);">
            🤖 Live Chat với AI Agent (Kết nối Backend)
          </div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">
            RAG + lịch sử hội thoại · ChromaDB · Gemini Flash
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">

          <!-- ── Khu vực ID khách hàng (có thể chỉnh sửa) ── -->
          <div id="liveChatIdArea" style="display:flex;align-items:center;gap:6px;">

            <!-- Trạng thái hiển thị (badge + nút sửa) -->
            <div id="liveChatIdDisplay" style="display:flex;align-items:center;gap:4px;">
              <span id="liveChatIdBadge"
                title="Click ✏️ để đổi ID khách hàng"
                style="font-size:0.7rem;background:var(--accent-emerald-bg);color:var(--accent-emerald);
                  padding:3px 10px;border-radius:6px;font-weight:600;white-space:nowrap;">
                🪪 ${liveChatCustomerId}
              </span>
              <button id="btnEditLiveChatId"
                title="Chỉnh sửa ID khách hàng"
                style="background:none;border:none;cursor:pointer;font-size:0.85rem;
                  color:var(--text-muted);padding:2px 4px;border-radius:4px;line-height:1;
                  transition:color 0.15s;"
                onmouseover="this.style.color='var(--accent-emerald)'"
                onmouseout="this.style.color='var(--text-muted)'">
                ✏️
              </button>
            </div>

            <!-- Trạng thái chỉnh sửa (input + xác nhận + hủy) — ẩn ban đầu -->
            <div id="liveChatIdEdit" style="display:none;align-items:center;gap:4px;">
              <input id="liveChatIdInput" type="text"
                value="${liveChatCustomerId}"
                style="font-size:0.72rem;padding:3px 8px;border-radius:6px;
                  border:1px solid var(--accent-emerald);background:var(--bg-card);
                  color:var(--text-primary);width:160px;font-family:monospace;"
                placeholder="Nhập ID khách hàng..."
              />
              <button id="btnConfirmLiveChatId"
                title="Xác nhận"
                style="font-size:0.72rem;padding:3px 8px;border-radius:6px;
                  background:var(--accent-emerald);color:white;border:none;cursor:pointer;font-weight:700;">
                ✓
              </button>
              <button id="btnCancelLiveChatId"
                title="Hủy"
                style="font-size:0.72rem;padding:3px 8px;border-radius:6px;
                  border:1px solid var(--border-primary);background:var(--bg-glass);
                  cursor:pointer;color:var(--text-muted);">
                ✕
              </button>
            </div>

          </div>

          <button id="btnClearLiveChat" style="font-size:0.72rem;padding:5px 10px;border-radius:6px;border:1px solid var(--border-primary);background:var(--bg-glass);cursor:pointer;color:var(--text-muted);">
            🗑 Xóa lịch sử
          </button>
        </div>
      </div>

      <div id="liveChatMessages"
        style="height:320px;overflow-y:auto;background:var(--bg-secondary);border-radius:10px;
               padding:14px;margin-bottom:12px;display:flex;flex-direction:column;gap:10px;">
        <div style="text-align:center;color:var(--text-muted);font-size:0.82rem;padding:20px 0;">
          💬 Nhập tin nhắn của khách hàng bên dưới để test AI Agent
        </div>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:10px;">
        <input id="liveChatInput" type="text" class="settings-input" style="flex:1;font-size:0.85rem;"
          placeholder="Nhập tin nhắn khách hàng... (VD: 'Cáp bị hỏng, đổi giúp mình!')">
        <button id="btnLiveChatSend" class="btn-approve" style="white-space:nowrap;">Gửi ↗</button>
      </div>

      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
        ${[
          'Shop ơi hàng có auth không?',
          'Mua 3 cái có giảm không?',
          'Cáp bị hỏng rồi shop ơi!',
          'Pin S24 Ultra dùng được bao lâu?',
          'Ship mấy ngày thì đến ạ?',
        ]
          .map(
            (t) =>
              `<button class="guidance-tag live-chat-quick" data-msg="${t}"
                style="font-size:0.7rem;padding:4px 8px;">${t}</button>`
          )
          .join('')}
      </div>

      <div style="padding:8px 12px;background:var(--accent-indigo-bg);border-radius:8px;font-size:0.75rem;color:var(--accent-indigo);">
        ℹ️ Mỗi tin nhắn được lưu vào SQLite. AI tra cứu chính sách + sản phẩm từ ChromaDB trước khi trả lời.
        Lịch sử 10 tin nhắn gần nhất được đưa vào context.
      </div>

      <!-- Real-time session analytics panel -->
      <div id="chatStatsPanel">
        <div style="margin-top:16px;border:1px solid var(--border-primary);border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);padding:10px 16px;display:flex;align-items:center;gap:8px;">
            <span style="font-size:1rem;">📊</span>
            <span style="font-size:0.82rem;font-weight:700;color:#e0e7ff;">Báo Cáo Phiên Chat – Realtime Analytics</span>
          </div>
          <div style="padding:20px;background:var(--bg-secondary);text-align:center;color:var(--text-muted);font-size:0.82rem;">
            💬 Gửi tin nhắn đầu tiên để xem phân tích realtime từ AI Agent...
          </div>
        </div>
      </div>
    </div>

    <!-- Chatbot Features & Quality Card (từ backend) -->
    <div class="content-card" id="chatbotFeaturesCard" style="margin-top:16px;">
      <div class="content-card-title">🧠 Tính Năng AI & Chất Lượng Chatbot</div>
      <div id="chatbotFeaturesContent" style="color:var(--text-muted);font-size:0.82rem;padding:8px 0;">
        ⏳ Đang tải từ backend...
      </div>
    </div>
  `;
}

function appendLiveChatBubble(role, text, meta = {}) {
  const container = document.getElementById('liveChatMessages');
  if (!container) return;

  const isUser = role === 'user';
  const div = document.createElement('div');
  div.style.cssText = `align-self:${isUser ? 'flex-end' : 'flex-start'};max-width:88%;`;

  if (role === 'thinking') {
    div.id = 'liveChatThinkingBubble';
    div.innerHTML = `
      <div style="padding:8px 14px;background:var(--accent-amber-bg);
        border-radius:10px;font-size:0.8rem;color:var(--accent-amber);
        border-left:3px solid var(--accent-amber);display:flex;align-items:center;gap:8px;">
        <span style="animation:spin 1s linear infinite;display:inline-block;">⏳</span>
        AI đang phân tích (RAG + Gemini)...
      </div>`;
  } else {
    const conf = meta.confidence_score !== undefined ? Math.round(meta.confidence_score * 100) : null;
    const safe = meta.is_safe;
    const sentiment = meta.sentiment_analysis;

    const metaBadges =
      !isUser && conf !== null
        ? `<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;">
            <span style="font-size:0.67rem;padding:2px 6px;border-radius:4px;
              background:${conf >= 70 ? 'var(--accent-emerald-bg)' : 'var(--accent-rose-bg)'};
              color:${conf >= 70 ? 'var(--accent-emerald)' : 'var(--accent-rose)'};">
              Confidence: ${conf}%
            </span>
            <span style="font-size:0.67rem;padding:2px 6px;border-radius:4px;
              background:${safe ? 'var(--accent-emerald-bg)' : 'var(--accent-rose-bg)'};
              color:${safe ? 'var(--accent-emerald)' : 'var(--accent-rose)'};">
              ${safe ? '✅ Tự động' : '⚠ Chờ duyệt'}
            </span>
            ${
              sentiment
                ? `<span style="font-size:0.67rem;padding:2px 6px;border-radius:4px;
                    background:var(--bg-glass);color:var(--text-muted);">
                    😶 ${sentiment}
                  </span>`
                : ''
            }
          </div>`
        : '';

    div.innerHTML = `
      <div style="font-size:0.68rem;color:var(--text-muted);margin-bottom:3px;">
        ${isUser ? '👤 Khách hàng' : '🤖 AI Agent'}
      </div>
      <div style="background:${isUser ? '#dbeafe' : 'var(--bg-card)'};
        padding:10px 14px;border-radius:${isUser ? '12px 0 12px 12px' : '0 12px 12px 12px'};
        font-size:0.85rem;line-height:1.55;border:1px solid var(--border-primary);">
        ${text}
        ${metaBadges}
      </div>`;
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

async function sendLiveChatMessage(msg) {
  if (!msg || !msg.trim()) return;

  const input = document.getElementById('liveChatInput');
  if (input) input.value = '';

  // Track session start
  if (!chatSessionStats.startTime) chatSessionStats.startTime = Date.now();
  chatSessionStats.totalUserMsgs++;

  appendLiveChatBubble('user', msg);

  // Thinking indicator
  const container = document.getElementById('liveChatMessages');
  const thinkingDiv = document.createElement('div');
  thinkingDiv.id = 'liveChatThinkingBubble';
  thinkingDiv.style.cssText = 'align-self:flex-start;';
  thinkingDiv.innerHTML = `<div style="padding:8px 14px;background:var(--accent-amber-bg);
    border-radius:10px;font-size:0.8rem;color:var(--accent-amber);
    border-left:3px solid var(--accent-amber);">⏳ AI đang phân tích (RAG + Gemini)...</div>`;
  if (container) { container.appendChild(thinkingDiv); container.scrollTop = container.scrollHeight; }

  const t0 = Date.now();

  try {
    const result = await apiCall('/chat-v3', 'POST', {
      customer_id: liveChatCustomerId,
      message: msg,
      brand_tone: 'Chuyên nghiệp, nhiệt tình',
    });

    const elapsed = Date.now() - t0;
    const thinking = document.getElementById('liveChatThinkingBubble');
    if (thinking) thinking.remove();

    if (result && result.reply) {
      const eval_ = result.ai_evaluation || {};
      appendLiveChatBubble('ai', result.reply, eval_);

      // --- Update session stats ---
      chatSessionStats.totalAIReplies++;
      chatSessionStats.avgResponseMs.push(elapsed);

      if (eval_.confidence_score !== undefined) {
        chatSessionStats.confidenceScores.push(eval_.confidence_score);
      }
      if (eval_.is_safe === true) chatSessionStats.totalSafe++;
      else if (eval_.is_safe === false) chatSessionStats.totalEscalated++;
      else chatSessionStats.totalSafe++; // default safe

      if (eval_.sentiment_analysis) {
        chatSessionStats.sentiments.push(eval_.sentiment_analysis);
      }

      // Refresh the stats panel
      renderChatSessionStats();

      // ── Đồng bộ tin nhắn vào Hộp Thư (Tin nhắn cần duyệt) ──
      _syncLiveChatToInbox(msg, result.reply, eval_);

    } else {
      appendLiveChatBubble('ai', 'Dạ em đang gặp chút trục trặc, anh/chị thử lại nhé ạ 🙏');
    }
  } catch (err) {
    const thinking = document.getElementById('liveChatThinkingBubble');
    if (thinking) thinking.remove();

    // ── Demo Mode: Mô phỏng AI response khi backend offline ──
    const negKeywords = ['hỏng', 'hư', 'lỗi', 'đổi trả', 'hoàn tiền', 'kém', 'thất vọng',
                         'chậm', 'bức xúc', 'tức', 'giả', 'fake', 'không sạc', 'tệ', 'dở'];
    const isNegative = negKeywords.some(k => msg.toLowerCase().includes(k));

    if (isNegative) {
      const mockReply = 'Dạ em xin lỗi anh/chị về trải nghiệm không tốt này ạ 🙏 Em đã ghi nhận phản hồi của anh/chị và sẽ chuyển ngay cho bộ phận kỹ thuật + CSKH kiểm tra. Anh/chị vui lòng cho em xin số đơn hàng để được hỗ trợ đổi/trả miễn phí ạ.';
      const mockEval = { is_safe: false, confidence_score: 0.42, sentiment_analysis: 'tức giận', identified_product_id: 'ANKER-100W-CAP', risk_level: 'Cao', risk_category: 'Chất lượng sản phẩm' };
      appendLiveChatBubble('ai', mockReply + ' <em style="font-size:0.68rem;color:var(--text-muted);">[Demo Mode]</em>', mockEval);
      _syncLiveChatToInbox(msg, mockReply, mockEval);
      chatSessionStats.totalAIReplies++;
      chatSessionStats.totalEscalated++;
      chatSessionStats.confidenceScores.push(0.42);
      chatSessionStats.sentiments.push('tức giận');
      renderChatSessionStats();
    } else {
      const mockReply = 'Dạ anh/chị ơi! Shop PhoneMax hân hạnh được phục vụ ạ. Em có thể giúp gì cho anh/chị?';
      const mockEval = { is_safe: true, confidence_score: 0.88, sentiment_analysis: 'bình thường' };
      appendLiveChatBubble('ai', mockReply + ' <em style="font-size:0.68rem;color:var(--text-muted);">[Demo Mode]</em>', mockEval);
      _syncLiveChatToInbox(msg, mockReply, mockEval);
      chatSessionStats.totalAIReplies++;
      chatSessionStats.totalSafe++;
      chatSessionStats.confidenceScores.push(0.88);
      chatSessionStats.sentiments.push('bình thường');
      renderChatSessionStats();
    }
    console.warn('[Agicom] Chat API offline — Demo mode kích hoạt:', err.message);
  }
}

/* ──────────────────────────────────────────────────────────────────────
   CHAT SESSION REPORT — Render real-time analytics panel
   ────────────────────────────────────────────────────────────────────── */
function renderChatSessionStats() {
  const panel = document.getElementById('chatStatsPanel');
  if (!panel) return;

  const s = chatSessionStats;
  const conf = s.avgConfidence();
  const sRate = s.safeRate();
  const sentCounts = s.sentimentCounts();
  const total = s.sentiments.length || 1;

  const posW  = Math.round(sentCounts.positive  / total * 100);
  const neutW = Math.round(sentCounts.neutral   / total * 100);
  const negW  = Math.round(sentCounts.negative  / total * 100);

  const confColor  = conf >= 80 ? '#10b981' : conf >= 60 ? '#f59e0b' : '#ef4444';
  const srateColor = sRate >= 80 ? '#10b981' : sRate >= 60 ? '#f59e0b' : '#ef4444';

  panel.innerHTML = `
    <div style="margin-top:16px;border:1px solid var(--border-primary);border-radius:12px;overflow:hidden;">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);
        padding:10px 16px;display:flex;align-items:center;gap:8px;">
        <span style="font-size:1rem;">📊</span>
        <span style="font-size:0.82rem;font-weight:700;color:#e0e7ff;letter-spacing:0.3px;">
          Báo Cáo Phiên Chat – Realtime Analytics
        </span>
        <span style="margin-left:auto;font-size:0.68rem;color:#a5b4fc;background:#312e81;
          padding:2px 8px;border-radius:10px;border:1px solid #4f46e5;">
          🕐 ${s.sessionDuration()}
        </span>
      </div>

      <div style="padding:14px;background:var(--bg-secondary);">

        <!-- KPI row -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;">

          <div style="background:var(--bg-card);border-radius:8px;padding:10px;text-align:center;border:1px solid var(--border-primary);">
            <div style="font-size:1.4rem;font-weight:800;color:var(--accent-indigo);">${s.totalUserMsgs}</div>
            <div style="font-size:0.65rem;color:var(--text-muted);margin-top:2px;">Tin nhắn<br>khách hàng</div>
          </div>

          <div style="background:var(--bg-card);border-radius:8px;padding:10px;text-align:center;border:1px solid var(--border-primary);">
            <div style="font-size:1.4rem;font-weight:800;color:${confColor};">${conf || '—'}${conf ? '%' : ''}</div>
            <div style="font-size:0.65rem;color:var(--text-muted);margin-top:2px;">Avg<br>Confidence</div>
          </div>

          <div style="background:var(--bg-card);border-radius:8px;padding:10px;text-align:center;border:1px solid var(--border-primary);">
            <div style="font-size:1.4rem;font-weight:800;color:${srateColor};">${s.totalAIReplies ? sRate + '%' : '—'}</div>
            <div style="font-size:0.65rem;color:var(--text-muted);margin-top:2px;">Tỉ lệ<br>Auto-Reply</div>
          </div>

          <div style="background:var(--bg-card);border-radius:8px;padding:10px;text-align:center;border:1px solid var(--border-primary);">
            <div style="font-size:1.4rem;font-weight:800;color:var(--accent-amber);">${s.avgResponse()}</div>
            <div style="font-size:0.65rem;color:var(--text-muted);margin-top:2px;">Avg Response<br>Time</div>
          </div>
        </div>

        <!-- Routing breakdown -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">
          <div style="background:#dcfce7;border-radius:8px;padding:10px;border-left:3px solid #16a34a;display:flex;align-items:center;gap:10px;">
            <span style="font-size:1.4rem;">✅</span>
            <div>
              <div style="font-size:1.1rem;font-weight:800;color:#15803d;">${s.totalSafe}</div>
              <div style="font-size:0.68rem;color:#166534;">Tự động gửi<br><span style="opacity:0.7;">(Safe · Confidence ≥ 70%)</span></div>
            </div>
          </div>
          <div style="background:#fef3c7;border-radius:8px;padding:10px;border-left:3px solid #d97706;display:flex;align-items:center;gap:10px;">
            <span style="font-size:1.4rem;">⚠️</span>
            <div>
              <div style="font-size:1.1rem;font-weight:800;color:#b45309;">${s.totalEscalated}</div>
              <div style="font-size:0.68rem;color:#92400e;">Chờ duyệt người<br><span style="opacity:0.7;">(Escalated · Cần review)</span></div>
            </div>
          </div>
        </div>

        ${s.sentiments.length > 0 ? `
        <!-- Sentiment distribution -->
        <div style="margin-bottom:10px;">
          <div style="font-size:0.75rem;font-weight:700;color:var(--text-secondary);margin-bottom:6px;">
            😶 Phân bố cảm xúc khách hàng (${s.sentiments.length} phân tích)
          </div>
          <!-- Bar chart -->
          <div style="border-radius:6px;overflow:hidden;height:12px;display:flex;gap:1px;margin-bottom:6px;">
            ${posW  > 0 ? `<div style="width:${posW}%;background:#10b981;transition:width 0.4s;" title="Tích cực ${posW}%"></div>` : ''}
            ${neutW > 0 ? `<div style="width:${neutW}%;background:#94a3b8;transition:width 0.4s;" title="Trung lập ${neutW}%"></div>` : ''}
            ${negW  > 0 ? `<div style="width:${negW}%;background:#ef4444;transition:width 0.4s;" title="Tiêu cực ${negW}%"></div>` : ''}
          </div>
          <div style="display:flex;gap:12px;font-size:0.68rem;color:var(--text-muted);">
            <span><span style="color:#10b981;font-weight:700;">●</span> Tích cực ${sentCounts.positive} (${posW}%)</span>
            <span><span style="color:#94a3b8;font-weight:700;">●</span> Trung lập ${sentCounts.neutral} (${neutW}%)</span>
            <span><span style="color:#ef4444;font-weight:700;">●</span> Tiêu cực ${sentCounts.negative} (${negW}%)</span>
          </div>
        </div>` : `
        <div style="text-align:center;padding:8px;font-size:0.78rem;color:var(--text-muted);
          background:var(--bg-glass);border-radius:8px;">
          💬 Gửi tin nhắn để xem phân tích cảm xúc theo thời gian thực
        </div>`}

        <!-- Confidence gauge (simple) -->
        ${conf > 0 ? `
        <div style="margin-top:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <span style="font-size:0.72rem;color:var(--text-muted);">Độ tin cậy trung bình AI</span>
            <span style="font-size:0.72rem;font-weight:700;color:${confColor};">${conf}%</span>
          </div>
          <div style="height:6px;background:var(--bg-glass);border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${conf}%;background:${confColor};border-radius:3px;transition:width 0.5s;"></div>
          </div>
          <div style="font-size:0.65rem;color:var(--text-muted);margin-top:3px;">
            ${conf >= 80 ? '🟢 Rất tốt — AI tự tin trả lời' : conf >= 60 ? '🟡 Khá — một số câu hỏi cần escalate' : '🔴 Thấp — nhiều câu hỏi nằm ngoài knowledge base'}
          </div>
        </div>` : ''}

      </div>
    </div>
  `;
}

/* ──────────────────────────────────────────────────────────────────────
   7. DAILY SUMMARY — /daily-summary + /export-daily-summary
   ────────────────────────────────────────────────────────────────────── */

async function loadDailySummary() {
  const container = document.getElementById('dailySummaryContent');
  if (!container) return;

  container.innerHTML =
    '<div style="text-align:center;padding:24px;color:var(--text-muted);">⏳ Đang tải tóm tắt từ backend...</div>';

  try {
    const data = await apiCall('/daily-summary');

    const risk = data.risk_management || {};
    const growth = data.growth_strategy || {};
    const insights = data.customer_sentiment_overview || [];
    const riskStatus = risk.status || 'An toàn';
    const riskTasks = risk.urgent_actions || [];
    const pricingTasks = growth.pricing_proposals || [];
    const contentTasks = growth.content_optimizations || [];
    const totalTasks = riskTasks.length + pricingTasks.length + contentTasks.length;

    const renderTaskList = (items, color) =>
      items.length
        ? items
            .map(
              (t) =>
                `<div style="padding:7px 10px;background:${color}18;border-radius:6px;
                  font-size:0.8rem;margin-bottom:4px;border-left:3px solid ${color};">
                  ${t}
                </div>`
            )
            .join('')
        : `<div style="font-size:0.8rem;color:var(--text-muted);padding:4px 0;">Không có tác vụ nào.</div>`;

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">
        <div style="padding:12px;background:${riskStatus === 'Cảnh báo' ? 'var(--accent-rose-bg)' : 'var(--accent-emerald-bg)'};
          border-radius:8px;text-align:center;">
          <div style="font-size:1.6rem;">${riskStatus === 'Cảnh báo' ? '⚠️' : '✅'}</div>
          <div style="font-size:0.72rem;font-weight:700;
            color:${riskStatus === 'Cảnh báo' ? 'var(--accent-rose)' : 'var(--accent-emerald)'};">
            Rủi ro: ${riskStatus}
          </div>
        </div>
        <div style="padding:12px;background:var(--accent-amber-bg);border-radius:8px;text-align:center;">
          <div style="font-size:1.6rem;font-weight:800;color:var(--accent-amber);">${totalTasks}</div>
          <div style="font-size:0.72rem;font-weight:700;color:var(--accent-amber);">Tác vụ chờ xử lý</div>
        </div>
        <div style="padding:12px;background:var(--accent-indigo-bg);border-radius:8px;text-align:center;">
          <div style="font-size:1.6rem;font-weight:800;color:var(--accent-indigo);">${insights.length}</div>
          <div style="font-size:0.72rem;font-weight:700;color:var(--accent-indigo);">Insights CSKH</div>
        </div>
      </div>

      ${riskTasks.length ? `
        <div style="margin-bottom:12px;">
          <div style="font-weight:700;font-size:0.82rem;color:var(--accent-rose);margin-bottom:6px;">
            🚨 Cảnh báo rủi ro (${riskTasks.length})
          </div>
          ${renderTaskList(riskTasks, '#ef4444')}
        </div>` : ''}

      ${pricingTasks.length ? `
        <div style="margin-bottom:12px;">
          <div style="font-weight:700;font-size:0.82rem;color:var(--accent-amber);margin-bottom:6px;">
            💰 Đề xuất chiến lược giá (${pricingTasks.length})
          </div>
          ${renderTaskList(pricingTasks, '#f59e0b')}
        </div>` : ''}

      ${contentTasks.length ? `
        <div style="margin-bottom:12px;">
          <div style="font-weight:700;font-size:0.82rem;color:var(--accent-indigo);margin-bottom:6px;">
            📝 Đề xuất cập nhật nội dung (${contentTasks.length})
          </div>
          ${renderTaskList(contentTasks, '#6366f1')}
        </div>` : ''}

      ${insights.length ? `
        <div style="margin-bottom:12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <div style="font-weight:700;font-size:0.82rem;color:var(--accent-emerald);">
              💬 Insights từ CSKH — Chatbot Report (${insights.length})
            </div>
            <span style="font-size:0.68rem;background:var(--accent-emerald-bg);color:var(--accent-emerald);
              padding:2px 8px;border-radius:8px;font-weight:600;">Live từ DB</span>
          </div>

          ${/* Phân loại insight theo keyword */
            (() => {
              const cats = {
                '⚠️ Giao hàng & Vận chuyển': [],
                '🔧 Chất lượng sản phẩm': [],
                '💰 Giá & Khuyến mãi': [],
                '💬 Dịch vụ & Thái độ': [],
                '📦 Khác': [],
              };
              insights.forEach(i => {
                const lower = i.toLowerCase();
                if (lower.includes('giao') || lower.includes('ship') || lower.includes('vận chuyển') || lower.includes('đặt hàng')) cats['⚠️ Giao hàng & Vận chuyển'].push(i);
                else if (lower.includes('chất lượng') || lower.includes('hỏng') || lower.includes('lỗi') || lower.includes('sản phẩm') || lower.includes('pin')) cats['🔧 Chất lượng sản phẩm'].push(i);
                else if (lower.includes('giá') || lower.includes('đắt') || lower.includes('rẻ') || lower.includes('khuyến') || lower.includes('sale')) cats['💰 Giá & Khuyến mãi'].push(i);
                else if (lower.includes('nhân viên') || lower.includes('shop') || lower.includes('tư vấn') || lower.includes('hỗ trợ') || lower.includes('phản hồi')) cats['💬 Dịch vụ & Thái độ'].push(i);
                else cats['📦 Khác'].push(i);
              });
              return Object.entries(cats)
                .filter(([,arr]) => arr.length > 0)
                .map(([cat, arr]) => `
                  <div style="margin-bottom:10px;">
                    <div style="font-size:0.73rem;font-weight:700;color:var(--text-secondary);
                      margin-bottom:5px;display:flex;align-items:center;gap:6px;">
                      ${cat}
                      <span style="font-weight:400;font-size:0.67rem;background:var(--bg-glass);
                        padding:1px 6px;border-radius:8px;color:var(--text-muted);">${arr.length}</span>
                    </div>
                    ${arr.slice(0, 3).map(i => `
                      <div style="padding:7px 10px;background:var(--accent-emerald-bg);
                        border-radius:6px;font-size:0.78rem;margin-bottom:4px;
                        border-left:3px solid var(--accent-emerald);line-height:1.45;">${i}</div>
                    `).join('')}
                    ${arr.length > 3 ? `<div style="font-size:0.7rem;color:var(--text-muted);padding:2px 4px;">
                      +${arr.length - 3} insight khác trong ngày
                    </div>` : ''}
                  </div>
                `).join('');
            })()
          }

          <!-- Summary bar -->
          <div style="padding:8px 12px;background:var(--bg-secondary);border-radius:8px;
            display:flex;gap:16px;flex-wrap:wrap;margin-top:4px;">
            <div style="font-size:0.72rem;color:var(--text-muted);">
              📈 <strong style="color:var(--text-primary);">${insights.length}</strong> tín hiệu từ chatbot hôm nay
            </div>
            <div style="font-size:0.72rem;color:var(--text-muted);">
              🤖 AI đã tự động xử lý và phân loại
            </div>
          </div>
        </div>` : ''}

      ${totalTasks === 0 && insights.length === 0
        ? `<div style="text-align:center;padding:16px;color:var(--text-muted);font-size:0.85rem;">
            ✅ Hệ thống ổn định — Không có tác vụ khẩn cấp hôm nay.
          </div>`
        : ''}

      <div style="display:flex;align-items:center;justify-content:space-between;
        margin-top:12px;flex-wrap:wrap;gap:8px;">
        <div style="font-size:0.72rem;color:var(--text-muted);">📅 Ngày báo cáo: ${data.date}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button onclick="generateContentSuggestionsFromSummary(window._lastDailySummaryData)"
            class="btn-approve"
            style="font-size:0.76rem;padding:6px 12px;background:var(--accent-indigo);border-color:var(--accent-indigo);">
            📝 Tạo đề xuất Content
          </button>
          <button onclick="exportDailySummary()" class="btn-approve" style="font-size:0.76rem;padding:6px 12px;">
            📤 Xuất & Lưu trữ
          </button>
          <button onclick="loadDailySummary()" class="btn-modal-cancel" style="font-size:0.76rem;padding:6px 12px;">
            🔄 Làm mới
          </button>
        </div>
      </div>
    `;
    // Lưu lại để nút "Tạo đề xuất Content" dùng
    window._lastDailySummaryData = data;
  } catch (err) {
    container.innerHTML = `
      <div style="color:var(--accent-rose);font-size:0.85rem;padding:12px;
        background:var(--accent-rose-bg);border-radius:8px;">
        ❌ Không thể tải từ backend.<br>
        <small style="color:var(--text-muted);">${err.message}</small><br>
        <small>Kiểm tra backend đang chạy tại: <strong>${API_BASE}</strong></small>
      </div>`;
    console.warn('[Agicom] Daily summary API lỗi:', err.message);
  }
}

async function exportDailySummary() {
  try {
    await apiCall('/export-daily-summary', 'POST');
    showToast('✅ Đã xuất báo cáo ngày và lưu vào archive thành công!', 'success');
    setTimeout(loadDailySummary, 800);
  } catch (err) {
    showToast('❌ Lỗi xuất báo cáo: ' + err.message, 'danger');
  }
}

/* ──────────────────────────────────────────────────────────────────────
   8. HUMAN APPROVAL — /act-and-learn
   ────────────────────────────────────────────────────────────────────── */

async function sendApprovalToBackend(proposalId, status, feedback = '') {
  try {
    await apiCall('/act-and-learn', 'POST', {
      proposal_id: proposalId,
      status,
      feedback,
    });
    console.log(`[Agicom] Approval sent: ${proposalId} → ${status}`);
  } catch (err) {
    console.warn('[Agicom] Approval API lỗi:', err.message);
  }
}

/* ──────────────────────────────────────────────────────────────────────
   9. RESET ALL — /system/reset-all
   ────────────────────────────────────────────────────────────────────── */

async function handleResetAll() {
  const confirmed = window.confirm(
    '⚠️ BẠN CÓ CHẮC CHẮN?\n\n' +
      'Thao tác này sẽ XÓA TOÀN BỘ:\n' +
      '  • Lịch sử chat\n' +
      '  • Lịch sử review\n' +
      '  • Tác vụ đang chờ\n' +
      '  • Kiến thức ChromaDB\n\n' +
      'Không thể hoàn tác!'
  );
  if (!confirmed) return;

  try {
    await apiCall('/system/reset-all', 'POST');
    showToast('✅ Đã reset toàn bộ dữ liệu AI về trạng thái trắng.', 'success');
  } catch (err) {
    showToast('❌ Lỗi reset: ' + err.message, 'danger');
    console.warn('[Agicom] Reset API lỗi:', err.message);
  }
}

/* ──────────────────────────────────────────────────────────────────────
   10. INJECT UI VÀO CÁC TRANG — Override navigate()
   ────────────────────────────────────────────────────────────────────── */

const _origNavigate = navigate;

navigate = function (page) {
  _origNavigate(page);

  // Inject thêm UI sau khi page render xong
  setTimeout(() => {
    if (page === 'dashboard') {
      injectDailySummaryCard();
    } else if (page === 'reviews') {
      // Chỉ tải dữ liệu — form submit đã chuyển sang trang Demo khách hàng
      loadReviewsFromAPI();
    } else if (page === 'chat') {
      // Live Chat widget đã chuyển sang trang Demo khách hàng
    } else if (page === 'settings') {
      injectResetButton();
    } else if (page === 'crisis-center') {
      loadCrisisFromBackend();
    } else if (page === 'demo-customer') {
      _injectDemoCustomerPage();
    } else if (page === 'content-suggestions') {
      _injectContentSuggestionsBar();
    }
  }, 80);
};

/* ── Inject: Action bar trên trang Content Suggestions ── */
function _injectContentSuggestionsBar() {
  const pageContent = document.getElementById('pageContent');
  if (!pageContent || document.getElementById('contentSuggestionsBar')) return;

  const fromDailySugs = (typeof MOCK !== 'undefined' && Array.isArray(MOCK.content_suggestions_generated))
    ? MOCK.content_suggestions_generated.filter(s => s._fromDailySummary)
    : [];

  const bar = document.createElement('div');
  bar.id = 'contentSuggestionsBar';
  bar.className = 'content-card';
  bar.style.cssText = 'margin-bottom:16px;border:2px solid var(--accent-indigo);background:linear-gradient(135deg,rgba(99,102,241,0.06),rgba(16,185,129,0.03));';

  if (fromDailySugs.length > 0) {
    // Đã có suggestion từ báo cáo — hiện tóm tắt + nút refresh
    const highCount = fromDailySugs.filter(s => s.priority === 'high').length;
    bar.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:40px;height:40px;border-radius:10px;background:var(--accent-indigo-bg);
            display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;">📊</div>
          <div>
            <div style="font-size:0.85rem;font-weight:800;color:var(--accent-indigo);">
              ${fromDailySugs.length} đề xuất content từ Báo cáo Hàng ngày
            </div>
            <div style="font-size:0.73rem;color:var(--text-muted);margin-top:2px;">
              ${highCount > 0 ? `<span style="color:#ef4444;font-weight:700;">${highCount} ưu tiên cao</span> · ` : ''}
              Tự động phân tích từ chat signals, reviews & báo cáo AI
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button onclick="generateContentSuggestionsFromSummary(window._lastDailySummaryData)"
            class="btn-approve" style="font-size:0.75rem;padding:6px 12px;
              background:var(--accent-indigo);border-color:var(--accent-indigo);">
            🔄 Tạo lại từ báo cáo
          </button>
          <button onclick="MOCK.content_suggestions_generated=MOCK.content_suggestions_generated.filter(s=>!s._fromDailySummary);navigate('content-suggestions')"
            class="btn-modal-cancel" style="font-size:0.75rem;padding:6px 12px;">
            ✕ Xóa đề xuất AI
          </button>
        </div>
      </div>`;
  } else {
    // Chưa có — hiện prompt hướng dẫn tạo
    const hasDailySummary = !!window._lastDailySummaryData;
    bar.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:40px;height:40px;border-radius:10px;background:rgba(99,102,241,0.1);
            display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0;">🤖</div>
          <div>
            <div style="font-size:0.85rem;font-weight:700;color:var(--text-primary);">
              Tạo đề xuất content từ dữ liệu thực
            </div>
            <div style="font-size:0.73rem;color:var(--text-muted);margin-top:2px;">
              ${hasDailySummary
                ? 'Đã có dữ liệu báo cáo hôm nay — nhấn để phân tích và sinh đề xuất'
                : 'Tải Báo cáo Hàng ngày từ Dashboard hoặc dùng dữ liệu Demo để tạo'}
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          ${hasDailySummary ? `
          <button onclick="generateContentSuggestionsFromSummary(window._lastDailySummaryData)"
            class="btn-approve" style="font-size:0.75rem;padding:6px 14px;
              background:var(--accent-indigo);border-color:var(--accent-indigo);">
            📝 Tạo từ Báo cáo hôm nay
          </button>` : ''}
          <button onclick="generateContentSuggestionsFromSummary(null)"
            class="btn-approve" style="font-size:0.75rem;padding:6px 14px;">
            ⚡ Tạo từ dữ liệu Demo
          </button>
          <button onclick="navigate('dashboard')"
            class="btn-modal-cancel" style="font-size:0.75rem;padding:6px 12px;">
            📋 Tải Báo cáo
          </button>
        </div>
      </div>`;
  }

  pageContent.insertBefore(bar, pageContent.firstChild);
}

/* ── Inject: Daily Summary Card vào Dashboard ── */
function injectDailySummaryCard() {
  const pageContent = document.getElementById('pageContent');
  if (!pageContent || document.getElementById('dailySummaryCard')) return;

  const card = document.createElement('div');
  card.id = 'dailySummaryCard';
  card.className = 'content-card';
  card.style.cssText =
    'margin-top:20px;border:2px solid var(--accent-indigo);';
  card.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;
      margin-bottom:14px;flex-wrap:wrap;gap:8px;">
      <div>
        <div class="content-card-title" style="margin:0;color:var(--accent-indigo);">
          📋 Tóm tắt AI Hàng ngày — Live từ Backend
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">
          Tổng hợp từ chat logs, reviews và coordination tasks trong ngày
        </div>
      </div>
      <button onclick="loadDailySummary()" class="btn-approve"
        style="font-size:0.76rem;padding:7px 14px;">
        📥 Tải tóm tắt
      </button>
    </div>
    <div id="dailySummaryContent">
      <div style="text-align:center;padding:16px;color:var(--text-muted);font-size:0.85rem;">
        Nhấn "Tải tóm tắt" để lấy dữ liệu thực từ backend
      </div>
    </div>
  `;
  pageContent.appendChild(card);
}

/* ── Inject: Review Form vào Reviews Page ── */
function injectReviewForm() {
  const pageContent = document.getElementById('pageContent');
  if (!pageContent || document.getElementById('reviewSubmitForm')) return;

  const form = document.createElement('div');
  form.id = 'reviewSubmitForm';
  form.className = 'content-card';
  form.style.cssText = 'margin-bottom:20px;border:2px solid var(--accent-amber);';
  form.innerHTML = `
    <div class="content-card-title" style="color:var(--accent-amber);">
      📝 Thêm Review Mới → AI Phân tích & Học hỏi
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px;">
      <div class="settings-field">
        <label class="settings-label">ID Sản phẩm</label>
        <input id="rev_product_id" class="settings-input" value="S24-ULTRA-001"
          placeholder="VD: ANKER-100W-CAP">
      </div>
      <div class="settings-field">
        <label class="settings-label">Tên khách hàng</label>
        <input id="rev_customer_name" class="settings-input" placeholder="VD: Nguyễn Văn A">
      </div>
      <div class="settings-field">
        <label class="settings-label">Số sao</label>
        <select id="rev_rating" class="settings-input">
          <option value="5">⭐⭐⭐⭐⭐ 5 sao</option>
          <option value="4">⭐⭐⭐⭐ 4 sao</option>
          <option value="3">⭐⭐⭐ 3 sao</option>
          <option value="2" selected>⭐⭐ 2 sao</option>
          <option value="1">⭐ 1 sao</option>
        </select>
      </div>
    </div>
    <div class="settings-field" style="margin-bottom:12px;">
      <label class="settings-label">Nội dung đánh giá</label>
      <textarea id="rev_text" class="settings-input" rows="3"
        placeholder="Nhập nội dung đánh giá của khách hàng...">Sản phẩm giao nhanh nhưng hộp bị móp một chút. Chất lượng ổn.</textarea>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button id="btnSubmitReview" class="btn-approve">
        🤖 Gửi & AI học hỏi
      </button>
      <button id="btnLoadDBReviews" class="btn-modal-cancel">
        📥 Tải reviews từ Database
      </button>
    </div>
    <div style="margin-top:10px;padding:8px;background:var(--accent-amber-bg);
      border-radius:8px;font-size:0.75rem;color:var(--accent-amber);">
      💡 Review được lưu vào SQLite + AI trích xuất insight → lưu vào ChromaDB để chatbot học hỏi
    </div>
  `;

  pageContent.insertBefore(form, pageContent.firstChild);
}

/* ── Inject: Live Chat Widget vào Chat Page ── */
function injectLiveChatWidget() {
  const pageContent = document.getElementById('pageContent');
  if (!pageContent || document.getElementById('liveChatWidgetContainer')) return;

  const widget = document.createElement('div');
  widget.id = 'liveChatWidgetContainer';
  widget.innerHTML = buildLiveChatWidgetHTML();
  pageContent.appendChild(widget);

  // Attach events
  const sendBtn = document.getElementById('btnLiveChatSend');
  const input = document.getElementById('liveChatInput');
  const clearBtn = document.getElementById('btnClearLiveChat');

  sendBtn?.addEventListener('click', () => {
    const msg = input?.value?.trim();
    if (msg) sendLiveChatMessage(msg);
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const msg = input.value.trim();
      if (msg) sendLiveChatMessage(msg);
    }
  });

  clearBtn?.addEventListener('click', async () => {
    try {
      await apiCall('/chat/' + liveChatCustomerId, 'DELETE');
      const container = document.getElementById('liveChatMessages');
      if (container)
        container.innerHTML =
          '<div style="text-align:center;color:var(--text-muted);font-size:0.8rem;padding:20px 0;">💬 Lịch sử đã xóa. Bắt đầu cuộc hội thoại mới.</div>';
      // Reset session stats
      chatSessionStats.reset();
      const statsPanel = document.getElementById('chatStatsPanel');
      if (statsPanel) statsPanel.innerHTML = `
        <div style="margin-top:16px;border:1px solid var(--border-primary);border-radius:12px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);padding:10px 16px;display:flex;align-items:center;gap:8px;">
            <span style="font-size:1rem;">📊</span>
            <span style="font-size:0.82rem;font-weight:700;color:#e0e7ff;">Báo Cáo Phiên Chat – Realtime Analytics</span>
          </div>
          <div style="padding:20px;background:var(--bg-secondary);text-align:center;color:var(--text-muted);font-size:0.82rem;">
            💬 Phiên mới — Gửi tin nhắn để bắt đầu theo dõi...
          </div>
        </div>`;
      showToast('Đã xóa lịch sử chat với AI', 'info');
    } catch (err) {
      showToast('Lỗi xóa lịch sử: ' + err.message, 'danger');
    }
  });

  // Quick message buttons
  document.querySelectorAll('.live-chat-quick').forEach((btn) => {
    btn.addEventListener('click', () => sendLiveChatMessage(btn.dataset.msg));
  });

  // ── Chỉnh sửa ID khách hàng ──
  _attachLiveChatIdEditorEvents();

  // Load chatbot features & quality data from backend
  loadChatbotFeatures();
}

/**
 * Gắn toàn bộ event logic cho khu vực chỉnh sửa ID khách hàng.
 * Tách ra để dễ gọi lại nếu widget được rebuild.
 */
function _attachLiveChatIdEditorEvents() {
  const display   = document.getElementById('liveChatIdDisplay');
  const editArea  = document.getElementById('liveChatIdEdit');
  const badge     = document.getElementById('liveChatIdBadge');
  const editBtn   = document.getElementById('btnEditLiveChatId');
  const input     = document.getElementById('liveChatIdInput');
  const confirmBtn= document.getElementById('btnConfirmLiveChatId');
  const cancelBtn = document.getElementById('btnCancelLiveChatId');
  if (!editBtn || !input || !confirmBtn || !cancelBtn) return;

  // Mở chế độ chỉnh sửa
  function openEdit() {
    input.value = liveChatCustomerId;
    display.style.display  = 'none';
    editArea.style.display = 'flex';
    input.focus();
    input.select();
  }

  // Lưu ID mới và cập nhật phiên làm việc
  function confirmEdit() {
    const newId = input.value.trim().replace(/\s+/g, '_');  // dùng _ thay khoảng trắng
    if (!newId) {
      input.style.borderColor = '#ef4444';
      input.placeholder = 'ID không được để trống!';
      setTimeout(() => { input.style.borderColor = ''; }, 1200);
      return;
    }

    const changed = newId !== liveChatCustomerId;
    liveChatCustomerId = newId;

    // Cập nhật badge
    if (badge) badge.textContent = '🪪 ' + liveChatCustomerId;

    // Đóng chế độ chỉnh sửa
    editArea.style.display = 'none';
    display.style.display  = 'flex';

    if (changed) {
      // Xóa lịch sử chat cũ trên UI
      const msgContainer = document.getElementById('liveChatMessages');
      if (msgContainer) {
        msgContainer.innerHTML =
          '<div style="text-align:center;color:var(--text-muted);font-size:0.82rem;padding:20px 0;">' +
          '🔄 Đã chuyển sang ID mới. Bắt đầu cuộc hội thoại mới.</div>';
      }
      // Reset session stats
      chatSessionStats.reset();
      const statsPanel = document.getElementById('chatStatsPanel');
      if (statsPanel) {
        statsPanel.innerHTML =
          '<div style="margin-top:16px;border:1px solid var(--border-primary);border-radius:12px;overflow:hidden;">' +
          '<div style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);padding:10px 16px;display:flex;align-items:center;gap:8px;">' +
          '<span style="font-size:1rem;">📊</span>' +
          '<span style="font-size:0.82rem;font-weight:700;color:#e0e7ff;">Báo Cáo Phiên Chat – Realtime Analytics</span>' +
          '</div>' +
          '<div style="padding:20px;background:var(--bg-secondary);text-align:center;color:var(--text-muted);font-size:0.82rem;">' +
          '💬 Phiên mới — Gửi tin nhắn để bắt đầu theo dõi...</div></div>';
      }
      showToast(`🪪 Đã đổi ID khách hàng sang: <strong>${liveChatCustomerId}</strong>`, 'success');
    } else {
      closeEdit();
    }
  }

  // Hủy chỉnh sửa
  function closeEdit() {
    input.value = liveChatCustomerId;
    editArea.style.display = 'none';
    display.style.display  = 'flex';
  }

  editBtn.addEventListener('click', openEdit);
  badge?.addEventListener('click', openEdit);          // click vào badge cũng mở edit
  confirmBtn.addEventListener('click', confirmEdit);
  cancelBtn.addEventListener('click', closeEdit);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); confirmEdit(); }
    if (e.key === 'Escape') { e.preventDefault(); closeEdit(); }
  });
}

/* ── Load Chatbot Features & Quality từ backend ── */
async function loadChatbotFeatures() {
  const el = document.getElementById('chatbotFeaturesContent');
  if (!el) return;

  try {
    const [featData, qualData] = await Promise.all([
      apiCall('/api/chatbot/features'),
      apiCall('/api/quality/overview'),
    ]);

    const features = (featData && featData.features) || [];
    const quality  = (qualData && qualData.items)    || [];

    const statusColor = (s) => {
      if (!s) return 'var(--text-muted)';
      if (s.toLowerCase().includes('ổn') || s.toLowerCase().includes('tốt')) return '#10b981';
      if (s.toLowerCase().includes('cập nhật') || s.toLowerCase().includes('đang')) return '#f59e0b';
      return '#ef4444';
    };

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
        ${features.map(f => `
          <div style="padding:10px 12px;background:var(--bg-secondary);border-radius:8px;
            border:1px solid var(--border-primary);border-left:3px solid ${statusColor(f.status)};">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
              <span style="font-size:0.8rem;font-weight:700;color:var(--text-primary);">${f.title}</span>
              <span style="font-size:0.65rem;padding:2px 7px;border-radius:8px;font-weight:600;
                background:${statusColor(f.status)}22;color:${statusColor(f.status)};">${f.status}</span>
            </div>
            <div style="font-size:0.73rem;color:var(--text-muted);line-height:1.45;">${f.detail || ''}</div>
          </div>
        `).join('')}
      </div>

      ${quality.length ? `
      <div style="border-top:1px solid var(--border-primary);padding-top:10px;">
        <div style="font-size:0.72rem;font-weight:700;color:var(--text-secondary);margin-bottom:8px;">
          🔍 Chất Lượng Hệ Thống AI
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          ${quality.map(q => `
            <div style="padding:10px 12px;background:var(--accent-indigo-bg);border-radius:8px;
              border:1px solid var(--accent-indigo)30;">
              <div style="font-size:0.77rem;font-weight:700;color:var(--accent-indigo);margin-bottom:3px;">${q.title}</div>
              <div style="font-size:0.82rem;font-weight:800;color:var(--text-primary);margin-bottom:3px;">${q.value}</div>
              <div style="font-size:0.7rem;color:var(--text-muted);line-height:1.4;">${q.note || ''}</div>
            </div>
          `).join('')}
        </div>
      </div>` : ''}
    `;
  } catch (err) {
    if (el) el.innerHTML = `<div style="font-size:0.8rem;color:var(--text-muted);padding:8px;">
      Không thể tải từ backend. <small>${err.message}</small>
    </div>`;
  }
}

/* ── Inject: Reset Button vào Settings Page ── */
function injectResetButton() {
  const pageContent = document.getElementById('pageContent');
  if (!pageContent || document.getElementById('resetSystemCard')) return;

  const card = document.createElement('div');
  card.id = 'resetSystemCard';
  card.className = 'content-card';
  card.style.cssText = 'margin-top:16px;border:2px solid var(--accent-rose);';
  card.innerHTML = `
    <div class="content-card-title" style="color:var(--accent-rose);">
      ⚠️ Quản trị Hệ thống — Nguy hiểm
    </div>
    <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:14px;">
      Các thao tác dưới đây sẽ ảnh hưởng vĩnh viễn đến dữ liệu hệ thống.
    </p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;">
      <button onclick="handleResetAll()"
        style="padding:8px 18px;border-radius:8px;border:2px solid var(--accent-rose);
          background:var(--accent-rose-bg);color:var(--accent-rose);
          font-weight:700;cursor:pointer;font-size:0.85rem;">
        🗑 Reset toàn bộ dữ liệu AI
      </button>
      <button onclick="loadDailySummary().catch(()=>{});navigate('dashboard')"
        style="padding:8px 18px;border-radius:8px;border:1px solid var(--border-primary);
          background:var(--bg-glass);color:var(--text-secondary);
          font-weight:600;cursor:pointer;font-size:0.85rem;">
        📋 Xem tóm tắt hôm nay
      </button>
    </div>
    <div style="margin-top:12px;font-size:0.75rem;color:var(--text-muted);">
      Backend URL hiện tại: <code style="background:var(--bg-secondary);padding:2px 6px;
        border-radius:4px;">${API_BASE}</code>
    </div>
  `;
  pageContent.appendChild(card);
}

/* ──────────────────────────────────────────────────────────────────────
   11. EVENT DELEGATION — Override handlePageClick + Modal Submit
   ────────────────────────────────────────────────────────────────────── */

// Intercept review form buttons
document.addEventListener('click', function (e) {
  // Submit review
  if (e.target.id === 'btnSubmitReview') {
    const product_id = document.getElementById('rev_product_id')?.value?.trim() || 'UNKNOWN';
    const rating = parseInt(document.getElementById('rev_rating')?.value || '3', 10);
    const review_text = document.getElementById('rev_text')?.value?.trim() || '';
    const customer_name = document.getElementById('rev_customer_name')?.value?.trim() || 'Ẩn danh';

    if (!review_text) {
      showToast('⚠️ Vui lòng nhập nội dung đánh giá!', 'warning');
      return;
    }
    submitReviewToAPI({ product_id, rating, review_text, customer_name });
  }

  // Load reviews from DB
  if (e.target.id === 'btnLoadDBReviews') {
    loadReviewsFromAPI();
  }
});

// Override modal submit to also send to backend
const _modalSubmitBtn = document.getElementById('modalSubmitBtn');
if (_modalSubmitBtn) {
  _modalSubmitBtn.addEventListener('click', function () {
    const reason = document.getElementById('feedbackText')?.value || '';
    if (typeof pendingFeedbackId !== 'undefined' && pendingFeedbackId) {
      sendApprovalToBackend(pendingFeedbackId, 'declined', reason);
    }
  });
}

// Override approval button click to send to backend
const _origHandlePageClick = typeof handlePageClick === 'function' ? handlePageClick : null;
if (_origHandlePageClick) {
  handlePageClick = function (e) {
    const target = e.target.closest('[data-action]');
    if (target?.dataset?.action === 'approve' && target?.dataset?.id) {
      sendApprovalToBackend(target.dataset.id, 'approved', '');
    }
    _origHandlePageClick(e);
  };
}

/* ──────────────────────────────────────────────────────────────────────
   10b. DEMO KHÁCH HÀNG — Inject review form + live chat widget
   ────────────────────────────────────────────────────────────────────── */

/**
 * Xây dựng nội dung trang "Demo Khách Hàng":
 *  1. Xóa placeholder skeleton
 *  2. Inject form "Thêm Review Mới → AI Phân tích & Học hỏi"
 *  3. Inject widget "Live Chat với AI Agent"
 *  4. Tải sẵn review list từ DB
 */
/**
 * Kịch bản demo: điền sẵn form review + chat input để demo nhanh.
 * Gọi từ nút trong demo scenario card.
 */
function _applyDemoScenario(scenario) {
  const SCENARIOS = {
    anker: {
      product_id: 'ANKER-100W-CAP',
      customer_name: 'Hoang_Manh_Demo',
      rating: '1',
      review_text: 'Cáp Anker 100W xài 1 tuần đã hư rồi, sạc rất chậm, dây nóng ran. Yêu cầu đổi trả! Hàng của shop kém chất lượng quá.',
      chat_msg: 'Shop ơi cáp Anker 100W tôi mua ở đây bị lỗi rồi! Sạc không vào, dây nóng ran. Tôi muốn đổi trả, có bồi thường không?',
      label: 'Cáp Anker lỗi hàng loạt'
    },
    shipping: {
      product_id: 'S24-ULTRA-001',
      customer_name: 'Khach_VIP_Demo',
      rating: '2',
      review_text: 'Điện thoại giao đến hộp bị móp nặng, may mà máy không sao. Shop cần đóng gói cẩn thận hơn, tôi rất thất vọng với dịch vụ giao hàng.',
      chat_msg: 'Shop ơi điện thoại tôi vừa nhận được mà hộp bị móp hết! Tôi rất bức xúc, shop xử lý thế nào đây?',
      label: 'Vận chuyển hư hỏng'
    }
  };

  const s = SCENARIOS[scenario];
  if (!s) return;

  // Điền form review
  const fields = {
    'rev_product_id': s.product_id,
    'rev_customer_name': s.customer_name,
    'rev_rating': s.rating,
    'rev_text': s.review_text
  };
  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  });

  // Điền chat input
  const chatInput = document.getElementById('liveChatInput');
  if (chatInput) chatInput.value = s.chat_msg;

  // Cập nhật status guide
  const statusEl = document.getElementById('demoScenarioStatus');
  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.innerHTML = `
      ✅ Đã điền kịch bản <strong>"${s.label}"</strong> — Thực hiện theo thứ tự:
      <span style="color:#ef4444;font-weight:700;">①</span> Nhấn "🤖 Gửi & AI học hỏi" ở phần review →
      <span style="color:#f59e0b;font-weight:700;">②</span> Nhấn "Gửi ↗" ở khung chat →
      <span style="color:#6366f1;font-weight:700;">③</span> Nhấn "🛡 Xem Crisis Center" trong popup hoặc từ sidebar`;
  }

  // Scroll đến form review để tiện điền
  setTimeout(() => document.getElementById('reviewSubmitForm')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
}

function _injectDemoCustomerPage() {
  const pageContent = document.getElementById('pageContent');
  if (!pageContent) return;

  // Xóa placeholder (nếu còn)
  const ph = document.getElementById('demoCustomerPlaceholder');
  if (ph) ph.remove();

  // ── Section 1: Review Form ──
  if (!document.getElementById('reviewSubmitForm')) {
    const reviewSection = document.createElement('div');
    reviewSection.innerHTML = `
      <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;
        letter-spacing:0.8px;color:var(--text-muted);margin-bottom:8px;">
        📋 Gửi đánh giá sản phẩm
      </div>`;

    const form = document.createElement('div');
    form.id = 'reviewSubmitForm';
    form.className = 'content-card';
    form.style.cssText = 'margin-bottom:8px;border:2px solid var(--accent-amber);';
    form.innerHTML = `
      <div class="content-card-title" style="color:var(--accent-amber);">
        📝 Thêm Review Mới → AI Phân tích & Học hỏi
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px;">
        <div class="settings-field">
          <label class="settings-label">ID Sản phẩm</label>
          <input id="rev_product_id" class="settings-input" value="S24-ULTRA-001"
            placeholder="VD: ANKER-100W-CAP">
        </div>
        <div class="settings-field">
          <label class="settings-label">Tên khách hàng</label>
          <input id="rev_customer_name" class="settings-input" placeholder="VD: Nguyễn Văn A">
        </div>
        <div class="settings-field">
          <label class="settings-label">Số sao</label>
          <select id="rev_rating" class="settings-input">
            <option value="5">⭐⭐⭐⭐⭐ 5 sao</option>
            <option value="4">⭐⭐⭐⭐ 4 sao</option>
            <option value="3">⭐⭐⭐ 3 sao</option>
            <option value="2" selected>⭐⭐ 2 sao</option>
            <option value="1">⭐ 1 sao</option>
          </select>
        </div>
      </div>
      <div class="settings-field" style="margin-bottom:12px;">
        <label class="settings-label">Nội dung đánh giá</label>
        <textarea id="rev_text" class="settings-input" rows="3"
          placeholder="Nhập nội dung đánh giá của khách hàng...">Sản phẩm giao nhanh nhưng hộp bị móp một chút. Chất lượng ổn.</textarea>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button id="btnSubmitReview" class="btn-approve">
          🤖 Gửi & AI học hỏi
        </button>
        <button id="btnLoadDBReviews" class="btn-modal-cancel">
          📥 Tải reviews từ Database
        </button>
      </div>
      <div style="margin-top:10px;padding:8px;background:var(--accent-amber-bg);
        border-radius:8px;font-size:0.75rem;color:var(--accent-amber);">
        💡 Review được lưu vào SQLite + AI trích xuất insight → lưu vào ChromaDB để chatbot học hỏi
      </div>`;

    reviewSection.appendChild(form);
    pageContent.appendChild(reviewSection);

    // Tải ngay danh sách review từ DB
    loadReviewsFromAPI();
  }

  // ── Section 2: Live Chat Widget ──
  if (!document.getElementById('liveChatWidgetContainer')) {
    const chatSection = document.createElement('div');
    chatSection.innerHTML = `
      <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;
        letter-spacing:0.8px;color:var(--text-muted);margin:20px 0 8px;">
        💬 Chat trực tiếp với AI Agent
      </div>`;
    pageContent.appendChild(chatSection);

    // Dùng lại hàm inject sẵn có (tự xử lý DOM, events)
    injectLiveChatWidget();
  }
}

/* ──────────────────────────────────────────────────────────────────────
   11a. SYNC LIVE CHAT → HỘP THƯ (Tin nhắn cần duyệt)
   ────────────────────────────────────────────────────────────────────── */

/**
 * Sau mỗi tin nhắn trong Live Chat widget, đưa cặp (câu hỏi khách + nháp AI)
 * vào MOCK.conversations và MOCK.chat_messages để hiển thị trong Hộp Thư.
 *
 * - is_safe === false  → status 'escalate'  (chờ duyệt khẩn)
 * - is_safe === true   → status 'pending'   (đã tự trả lời, lưu làm log)
 */
function _syncLiveChatToInbox(customerMsg, aiReply, evalData) {
  if (typeof MOCK === 'undefined') return;

  const isEscalated = evalData.is_safe === false;
  const conf = evalData.confidence_score !== undefined
    ? Math.round(evalData.confidence_score * 100)
    : null;
  const sentiment = evalData.sentiment_analysis || '';

  const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const newId = 'live_' + Date.now();

  // Tính sentiment score cho thanh màu trong danh sách (0-100)
  const sentimentScore = (() => {
    const s = sentiment.toLowerCase();
    if (s.includes('tích cực') || s.includes('positive') || s.includes('hài lòng')) return 80;
    if (s.includes('tiêu cực') || s.includes('negative') || s.includes('bức xúc') || s.includes('tức giận')) return 20;
    return 55;
  })();

  // ── Thêm vào đầu danh sách hội thoại ──
  // Dùng liveChatCustomerId làm tên để đồng bộ với badge trong widget
  const displayName = (typeof liveChatCustomerId !== 'undefined' && liveChatCustomerId)
    ? liveChatCustomerId
    : 'Khách Live Chat';
  const avatarChar = displayName.charAt(0).toUpperCase();

  MOCK.conversations.unshift({
    id: newId,
    name: displayName,
    avatar: avatarChar,
    time: now,
    status: isEscalated ? 'escalate' : 'pending',
    unread: 1,
    preview: customerMsg.length > 55 ? customerMsg.substring(0, 55) + '...' : customerMsg,
    category: isEscalated ? 'Cần duyệt' : 'Live Chat',
    sentiment: sentimentScore,
    wait_min: isEscalated ? 1 : 0,
    priority: isEscalated ? 0 : 2,
    ltv: 0,
    orders: 0,
    platform: 'Live Chat',
    angry: sentimentScore < 30,
    customer: {
      note: `Live Chat · ID: ${displayName} · Confidence: ${conf !== null ? conf + '%' : '—'} · Cảm xúc: ${sentiment || 'bình thường'}`,
      risk: isEscalated ? 'high' : 'low',
      churn: '—',
      purchases: []
    }
  });

  // ── Thêm lịch sử tin nhắn ──
  MOCK.chat_messages[newId] = [
    { from: 'customer', time: now, text: customerMsg }
  ];

  if (isEscalated) {
    // Cần duyệt → hiển thị nháp AI để chủ shop quyết định
    MOCK.chat_messages[newId].push(
      { from: 'ai_thinking', text: 'AI phân tích ngữ cảnh và tìm kiếm trong knowledge base...', context: [
          `Confidence: ${conf !== null ? conf + '%' : '—'}`,
          `Cảm xúc: ${sentiment || 'bình thường'}`,
          'is_safe: ❌ Cần duyệt thủ công'
        ]
      },
      { from: 'ai_draft', text: aiReply, confidence: conf }
    );
    showToast(`⚠️ Tin nhắn Live Chat cần duyệt — đã chuyển vào Hộp Thư!`, 'warning');
  } else {
    // Tự động gửi → lưu làm log
    MOCK.chat_messages[newId].push({
      from: 'ai_sent',
      time: now,
      text: aiReply
    });
  }

  // ── Cập nhật badge số tin nhắn trong sidebar ──
  const pendingCount = MOCK.conversations.filter(c => c.status === 'escalate' || c.status === 'pending').length;
  const chatBadge = document.querySelector('.nav-child-item[data-page="chat"] .nav-item-badge');
  if (chatBadge) chatBadge.textContent = pendingCount;

  // ── Nếu đang ở trang chat → re-render để inbox cập nhật ngay ──
  if (typeof currentPage !== 'undefined' && currentPage === 'chat' && typeof navigate === 'function') {
    setTimeout(() => navigate('chat'), 300);
  }
}

/* ──────────────────────────────────────────────────────────────────────
   11b. CRISIS CENTER — /api/crisis-overview
   ────────────────────────────────────────────────────────────────────── */

/** Render một thẻ sản phẩm có tín hiệu khủng hoảng (dùng chung cho live + mock). */
function _renderCrisisCard(c) {
  const csev = c.severity === 'critical' ? { color: '#ef4444', label: '🔴 Khẩn cấp' }
             : c.severity === 'warning'  ? { color: '#f59e0b', label: '🟡 Cảnh báo' }
             :                              { color: '#6366f1', label: '🔵 Theo dõi' };

  // Safe array access — tránh lỗi khi backend trả về null
  const reviews      = Array.isArray(c.reviews)      ? c.reviews      : [];
  const risk_tasks   = Array.isArray(c.risk_tasks)   ? c.risk_tasks   : [];
  const chat_signals = Array.isArray(c.chat_signals) ? c.chat_signals : [];

  // Helper tạo HTML cho 1 review item
  const reviewItemHtml = (r) => `
    <div style="padding:6px 10px;background:rgba(239,68,68,0.05);border-radius:6px;
      font-size:0.77rem;margin-bottom:4px;border-left:3px solid #ef4444;">
      <strong style="color:#ef4444;">${r.rating}⭐ — ${r.customer}</strong>
      <span style="color:var(--text-muted);font-size:0.7rem;margin-left:6px;">${r.time || ''}</span>
      <div style="color:var(--text-secondary);margin-top:2px;line-height:1.4;">${r.text}</div>
      ${r.insight ? `<div style="font-size:0.7rem;color:var(--accent-indigo);margin-top:2px;">💡 ${r.insight}</div>` : ''}
    </div>`;

  // Chỉ hiện 5 review đầu, còn lại ẩn sau nút "Xem thêm"
  const PREVIEW_COUNT = 5;
  const cardId = 'crisis_' + (c.product_id || '').replace(/\W/g, '_') + '_' + Date.now();
  let reviewsHtml = '';
  if (reviews.length > 0) {
    const visible = reviews.slice(0, PREVIEW_COUNT);
    const hidden  = reviews.slice(PREVIEW_COUNT);
    reviewsHtml = visible.map(reviewItemHtml).join('');
    if (hidden.length > 0) {
      reviewsHtml += `
        <div id="${cardId}_extra" style="display:none;">
          ${hidden.map(reviewItemHtml).join('')}
        </div>
        <button
          onclick="
            var el = document.getElementById('${cardId}_extra');
            var btn = this;
            if (el.style.display === 'none') {
              el.style.display = 'block';
              btn.textContent = '▲ Ẩn bớt';
            } else {
              el.style.display = 'none';
              btn.textContent = '▼ Xem thêm ${hidden.length} review';
            }"
          style="margin-top:4px;margin-bottom:4px;font-size:0.72rem;padding:4px 12px;
            border:1px solid rgba(239,68,68,0.35);border-radius:6px;background:rgba(239,68,68,0.07);
            color:#ef4444;cursor:pointer;font-weight:600;">
          ▼ Xem thêm ${hidden.length} review
        </button>`;
    }
  }

  const tasksHtml = risk_tasks.length
    ? risk_tasks.map(t => `
        <div style="padding:6px 10px;background:rgba(245,158,11,0.07);border-radius:6px;
          font-size:0.76rem;margin-bottom:3px;border-left:3px solid #f59e0b;color:var(--text-secondary);">
          ⚠️ ${t}
        </div>`).join('')
    : '';

  const chatHtml = chat_signals.length
    ? chat_signals.map(s => `
        <div style="padding:5px 10px;background:rgba(99,102,241,0.06);border-radius:6px;
          font-size:0.75rem;margin-bottom:3px;border-left:3px solid #6366f1;color:var(--text-muted);">
          💬 ${s}
        </div>`).join('')
    : '';

  return `
    <div style="border:1px solid ${csev.color}40;border-radius:10px;overflow:hidden;margin-bottom:12px;">
      <div style="background:${csev.color}12;padding:10px 14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span style="font-size:0.82rem;font-weight:800;color:${csev.color};">${csev.label}</span>
        <span style="font-size:0.78rem;font-weight:700;color:var(--text-primary);">
          Sản phẩm: <code style="background:var(--bg-glass);padding:1px 6px;border-radius:4px;">${c.product_id}</code>
        </span>
        <span style="margin-left:auto;font-size:0.7rem;background:${csev.color}18;
          color:${csev.color};padding:2px 8px;border-radius:8px;font-weight:700;">
          Score: ${c.severity_score}/100
        </span>
      </div>
      <div style="padding:12px 14px;background:var(--bg-secondary);">
        <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
          ${c.neg_review_count  > 0 ? `<span style="font-size:0.72rem;padding:3px 8px;border-radius:6px;background:rgba(239,68,68,0.1);color:#ef4444;font-weight:700;">📋 ${c.neg_review_count} review xấu</span>` : ''}
          ${c.risk_task_count   > 0 ? `<span style="font-size:0.72rem;padding:3px 8px;border-radius:6px;background:rgba(245,158,11,0.1);color:#f59e0b;font-weight:700;">⚠️ ${c.risk_task_count} tác vụ rủi ro</span>` : ''}
          ${c.chat_signal_count > 0 ? `<span style="font-size:0.72rem;padding:3px 8px;border-radius:6px;background:rgba(99,102,241,0.1);color:#6366f1;font-weight:700;">💬 ${c.chat_signal_count} tín hiệu chat</span>` : ''}
        </div>
        ${reviewsHtml}${tasksHtml}${chatHtml}
      </div>
    </div>`;
}

/**
 * Xây dựng cấu trúc dữ liệu crisis từ MOCK data (khi backend offline).
 * Phân tích: MOCK.reviews (rating ≤ 3), MOCK.chat_clusters (urgent),
 *            MOCK.conversations (status=escalate hoặc angry=true).
 */
function _buildCrisisFromMockData() {
  const productMap = {};

  const ensureProduct = (pid) => {
    if (!productMap[pid]) {
      productMap[pid] = {
        product_id: pid,
        neg_review_count: 0, risk_task_count: 0, chat_signal_count: 0,
        reviews: [], risk_tasks: [], chat_signals: [],
        severity_score: 0, severity: 'monitoring'
      };
    }
    return productMap[pid];
  };

  // 1. Reviews tiêu cực
  if (typeof MOCK !== 'undefined' && Array.isArray(MOCK.reviews)) {
    MOCK.reviews.filter(r => (r.rating || 5) <= 3).forEach(r => {
      const pid = r.product_id || r.sku_id || 'General';
      const entry = ensureProduct(pid);
      entry.neg_review_count++;
      entry.reviews.push({
        rating: r.rating,
        customer: r.author || 'Khách hàng',
        time: r.date || r.time || 'Gần đây',
        text: r.text || r.review || '',
        insight: (r.tag && r.tag.label) ? r.tag.label : null
      });
    });
  }

  // 2. Chat clusters khẩn cấp
  if (typeof MOCK !== 'undefined' && Array.isArray(MOCK.chat_clusters)) {
    MOCK.chat_clusters.filter(cl => cl.urgent).forEach(cl => {
      const pid = cl.product_id || 'General';
      const entry = ensureProduct(pid);
      entry.chat_signal_count++;
      entry.chat_signals.push(`${cl.label} (${cl.count} cuộc hội thoại)`);
    });
  }

  // 3. Conversations leo thang / khách tức giận
  if (typeof MOCK !== 'undefined' && Array.isArray(MOCK.conversations)) {
    MOCK.conversations.filter(c => c.status === 'escalate' || c.angry).forEach(c => {
      const pid = c.product_id || 'General';
      const entry = ensureProduct(pid);
      entry.risk_task_count++;
      const preview = c.last_message || c.preview || 'Tin nhắn chờ xử lý';
      entry.risk_tasks.push(`Hội thoại với ${c.customer || c.name || 'Khách'}: ${preview}`);
    });
  }

  // 4. Tính severity
  const crises = Object.values(productMap).map(p => {
    p.severity_score = Math.min(100,
      p.neg_review_count  * 20 +
      p.risk_task_count   * 25 +
      p.chat_signal_count * 15
    );
    p.severity = p.severity_score >= 60 ? 'critical'
               : p.severity_score >= 30 ? 'warning'
               :                          'monitoring';
    return p;
  }).sort((a, b) => b.severity_score - a.severity_score);

  const total_neg_reviews  = crises.reduce((s, p) => s + p.neg_review_count,  0);
  const total_risk_tasks   = crises.reduce((s, p) => s + p.risk_task_count,   0);
  const total_chat_signals = crises.reduce((s, p) => s + p.chat_signal_count, 0);

  let overall_status = 'safe';
  if      (crises.some(p => p.severity === 'critical'))  overall_status = 'critical';
  else if (crises.some(p => p.severity === 'warning'))   overall_status = 'warning';
  else if (crises.length > 0)                            overall_status = 'monitoring';

  return { overall_status, total_crisis_products: crises.length,
           total_neg_reviews, total_risk_tasks, total_chat_signals,
           crises, last_updated: new Date().toISOString() };
}

/** Render nội dung panel crisis (dùng chung cho live backend và mock data). */
function _renderCrisisPanel(contentEl, data, isFromMock) {
  const statusMap = {
    critical:   { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   icon: '🔴', label: 'CẢNH BÁO KHẨN CẤP' },
    warning:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  icon: '🟡', label: 'CẦN THEO DÕI' },
    monitoring: { color: '#6366f1', bg: 'rgba(99,102,241,0.08)', icon: '🔵', label: 'ĐANG QUAN SÁT' },
    safe:       { color: '#10b981', bg: 'rgba(16,185,129,0.08)', icon: '🟢', label: 'AN TOÀN' },
  };
  const st = statusMap[data.overall_status] || statusMap.safe;

  // Cập nhật MOCK.alerts
  if (data.total_neg_reviews > 0 || data.total_risk_tasks > 0) {
    const liveAlert = {
      level: data.overall_status === 'critical' ? 'critical' : 'warning',
      icon: st.icon,
      text: `${isFromMock ? '[DEMO] ' : '[LIVE] '}${data.total_neg_reviews} review tiêu cực & ${data.total_risk_tasks} tác vụ rủi ro đang chờ xử lý`,
      cta: 'Xem ngay', cta_page: 'crisis-center', _fromBackend: !isFromMock
    };
    if (typeof MOCK !== 'undefined' && MOCK.alerts) {
      MOCK.alerts = MOCK.alerts.filter(a => !a._fromBackend);
      MOCK.alerts.unshift(liveAlert);
    }
    // Toast chỉ khi có dữ liệu live thật
    if (!isFromMock) {
      if (data.overall_status === 'critical') {
        showToast(`🔴 Phát hiện ${data.total_neg_reviews} review xấu & ${data.total_risk_tasks} cảnh báo rủi ro — Kiểm tra ngay!`, 'danger');
      } else if (data.overall_status === 'warning') {
        showToast(`🟡 ${data.total_neg_reviews} review tiêu cực được ghi nhận — Theo dõi chặt chẽ hơn`, 'warning');
      }
    }
  }

  // Badge nguồn dữ liệu
  const sourceBadge = isFromMock
    ? `<span style="font-size:0.65rem;padding:2px 8px;border-radius:6px;background:rgba(245,158,11,0.15);color:#f59e0b;font-weight:700;border:1px solid rgba(245,158,11,0.3);">🟡 Demo Data (Backend offline)</span>`
    : `<span style="font-size:0.65rem;padding:2px 8px;border-radius:6px;background:rgba(16,185,129,0.12);color:#10b981;font-weight:700;border:1px solid rgba(16,185,129,0.3);">🟢 Live Backend</span>`;

  if (data.crises.length === 0) {
    contentEl.innerHTML = `
      <div style="text-align:right;margin-bottom:8px;">${sourceBadge}</div>
      <div style="text-align:center;padding:20px;background:rgba(16,185,129,0.06);border-radius:10px;border:1px solid rgba(16,185,129,0.2);">
        <div style="font-size:2rem;margin-bottom:6px;">✅</div>
        <div style="font-weight:700;color:#10b981;font-size:0.9rem;">Hệ thống ổn định</div>
        <div style="color:var(--text-muted);font-size:0.78rem;margin-top:4px;">
          Không phát hiện tín hiệu tiêu cực nào từ reviews & chat trong thời gian gần đây.
        </div>
      </div>`;
    return;
  }

  const kpiBar = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px;">
      <div>${sourceBadge}</div>
      <div style="font-size:0.68rem;color:var(--text-muted);">⏱ ${new Date(data.last_updated).toLocaleString('vi-VN')}</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;">
      <div style="background:${st.bg};border-radius:8px;padding:10px;text-align:center;border:1px solid ${st.color}30;">
        <div style="font-size:1.3rem;font-weight:800;color:${st.color};">${st.icon}</div>
        <div style="font-size:0.68rem;color:${st.color};font-weight:700;margin-top:2px;">${st.label}</div>
      </div>
      <div style="background:rgba(239,68,68,0.07);border-radius:8px;padding:10px;text-align:center;border:1px solid rgba(239,68,68,0.2);">
        <div style="font-size:1.3rem;font-weight:800;color:#ef4444;">${data.total_neg_reviews}</div>
        <div style="font-size:0.65rem;color:var(--text-muted);margin-top:2px;">Review tiêu cực</div>
      </div>
      <div style="background:rgba(245,158,11,0.07);border-radius:8px;padding:10px;text-align:center;border:1px solid rgba(245,158,11,0.2);">
        <div style="font-size:1.3rem;font-weight:800;color:#f59e0b;">${data.total_risk_tasks}</div>
        <div style="font-size:0.65rem;color:var(--text-muted);margin-top:2px;">Tác vụ rủi ro</div>
      </div>
      <div style="background:rgba(99,102,241,0.07);border-radius:8px;padding:10px;text-align:center;border:1px solid rgba(99,102,241,0.2);">
        <div style="font-size:1.3rem;font-weight:800;color:#6366f1;">${data.total_chat_signals}</div>
        <div style="font-size:0.65rem;color:var(--text-muted);margin-top:2px;">Tín hiệu chat</div>
      </div>
    </div>`;

  contentEl.innerHTML = kpiBar + data.crises.map(_renderCrisisCard).join('');
}

/**
 * Gọi /api/crisis-overview để lấy tín hiệu tiêu cực từ reviews + chat.
 * Khi backend offline, tự động fallback sang MOCK data để demo vẫn hoạt động.
 */
async function loadCrisisFromBackend() {
  const pageContent = document.getElementById('pageContent');
  if (!pageContent) return;

  // Xóa panel cũ nếu có để tránh duplicate
  const existing = document.getElementById('crisisLivePanel');
  if (existing) existing.remove();

  const panel = document.createElement('div');
  panel.id = 'crisisLivePanel';
  panel.className = 'content-card';
  panel.style.cssText = 'margin-bottom:20px;border:2px solid var(--accent-indigo);';
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
      <div>
        <div class="content-card-title" style="margin:0;color:var(--accent-indigo);">
          🔴 Phát hiện Khủng hoảng — Dữ liệu Thực từ Backend
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">
          Tổng hợp từ Reviews tiêu cực + Chat Signals + RiskManager Tasks
        </div>
      </div>
      <button onclick="loadCrisisFromBackend()" class="btn-approve" style="font-size:0.75rem;padding:6px 12px;">
        🔄 Làm mới
      </button>
    </div>
    <div id="crisisLiveContent" style="color:var(--text-muted);font-size:0.83rem;text-align:center;padding:16px;">
      ⏳ Đang phân tích tín hiệu...
    </div>
  `;
  pageContent.insertBefore(panel, pageContent.firstChild);

  const contentEl = document.getElementById('crisisLiveContent');
  if (!contentEl) return;

  // ── Thử backend trước, fallback sang MOCK nếu lỗi ──
  let data = null;
  let isFromMock = false;

  try {
    data = await apiCall('/api/crisis-overview');
  } catch (err) {
    console.warn('[Agicom] Backend offline — dùng MOCK data cho Crisis panel:', err.message);
    try {
      data = _buildCrisisFromMockData();
      isFromMock = true;
    } catch (mockErr) {
      contentEl.innerHTML = `
        <div style="color:var(--accent-rose);font-size:0.83rem;padding:10px;
          background:var(--accent-rose-bg);border-radius:8px;">
          ❌ Không thể tải dữ liệu khủng hoảng.<br>
          <small style="color:var(--text-muted);">Backend offline và MOCK data lỗi: ${mockErr.message}</small>
        </div>`;
      return;
    }
  }

  try {
    _renderCrisisPanel(contentEl, data, isFromMock);
    // Sinh kế hoạch xử lý khủng hoảng ngay sau panel cảnh báo
    if (data.crises.length > 0) {
      window._lastCrisisData = data;
      setTimeout(() => _renderCrisisResponsePlan(panel, data), 50);
    }
  } catch (renderErr) {
    contentEl.innerHTML = `
      <div style="color:var(--accent-rose);font-size:0.83rem;padding:10px;
        background:var(--accent-rose-bg);border-radius:8px;">
        ❌ Lỗi hiển thị dữ liệu khủng hoảng.<br>
        <small style="color:var(--text-muted);">${renderErr.message}</small>
      </div>`;
  }
}

/* ──────────────────────────────────────────────────────────────────────
   11c. CRISIS RESPONSE PLAN — Kế hoạch xử lý khủng hoảng tự động
   ────────────────────────────────────────────────────────────────────── */

/**
 * Sinh kế hoạch xử lý khủng hoảng dựa trên tín hiệu đã phát hiện.
 * Chèn vào ngay sau crisisLivePanel.
 * @param {HTMLElement} panelEl - element crisisLivePanel để tính vị trí insert
 * @param {object} data - dữ liệu crisis (cùng cấu trúc với /api/crisis-overview)
 */
function _renderCrisisResponsePlan(panelEl, data) {
  // Xóa kế hoạch cũ nếu có
  document.getElementById('crisisResponsePlan')?.remove();

  if (!data || !data.crises || data.crises.length === 0) return;

  const topCrisis = data.crises[0];
  const affectedProducts = data.crises.map(c => c.product_id).join(', ');
  const statusColor = topCrisis.severity === 'critical' ? '#ef4444' : '#f59e0b';

  // Phân tích loại vấn đề từ insights trong reviews
  const allInsights = data.crises.flatMap(c =>
    (Array.isArray(c.reviews) ? c.reviews : []).map(r => r.insight || '').filter(Boolean)
  ).join(' ').toLowerCase();

  const hasQuality  = allInsights.includes('chất lượng') || allInsights.includes('hư') || allInsights.includes('lỗi');
  const hasShipping = allInsights.includes('vận chuyển') || allInsights.includes('đóng gói') || allInsights.includes('móp');
  const hasChatRisk = data.total_chat_signals > 0 || data.total_risk_tasks > 0;

  // ── Hành động ngay (0–4h) ──
  const immediateActions = [];
  if (data.total_neg_reviews > 0)
    immediateActions.push(`Phản hồi công khai <strong>${data.total_neg_reviews} review tiêu cực</strong> trong 2 giờ tới bằng template bên dưới`);
  if (hasChatRisk)
    immediateActions.push(`Chủ động liên hệ lại <strong>${data.total_chat_signals + data.total_risk_tasks} khách</strong> đang bức xúc qua inbox`);
  if (hasQuality)
    immediateActions.push(`Tạm dừng quảng cáo sản phẩm <strong>${affectedProducts}</strong> để tránh thêm khách mua hàng lỗi`);
  if (hasShipping)
    immediateActions.push('Liên hệ đơn vị vận chuyển — yêu cầu đổi quy trình đóng gói, thêm lớp bảo vệ');
  if (topCrisis.severity === 'critical')
    immediateActions.push('Báo cáo khẩn lên quản lý và chuẩn bị phương án <strong>hoàn tiền / đổi hàng</strong> cho khách bị ảnh hưởng');
  if (immediateActions.length === 0)
    immediateActions.push(`Theo dõi sát sản phẩm <strong>${affectedProducts}</strong> và chuẩn bị phản hồi nhanh nếu có thêm khiếu nại`);

  // ── Xử lý trung hạn (1–7 ngày) ──
  const midTermActions = [
    hasQuality  ? `Liên hệ nhà cung cấp <strong>${affectedProducts}</strong> — yêu cầu kiểm tra QC lô hàng và phương án bảo hành` : `Rà soát quy trình kiểm tra chất lượng đầu vào cho <strong>${affectedProducts}</strong>`,
    hasShipping ? 'Nâng cấp vật liệu đóng gói (thùng carton 5 lớp) — tăng chi phí ~2.000đ/đơn, giảm rủi ro review xấu' : 'Chuẩn bị tài liệu hướng dẫn đóng gói chuẩn cho nhân viên kho',
    'Cập nhật Knowledge Base chatbot với Q&A mới từ sự cố này để AI trả lời tốt hơn lần sau',
    `Theo dõi biến động rating sản phẩm <strong>${affectedProducts}</strong> hàng ngày trong 7 ngày tới`,
    'Tổng kết sự cố thành case study nội bộ, xây dựng SOP phòng ngừa cho tương lai'
  ];

  // ── Template phản hồi review ──
  const replyTemplate = hasQuality
    ? `"Dạ anh/chị ơi, em xin lỗi về trải nghiệm không tốt này ạ 🙏 Shop đã ghi nhận và phát hiện có thể lô hàng này gặp vấn đề chất lượng. Anh/chị vui lòng inbox để em hỗ trợ đổi sản phẩm mới hoặc hoàn tiền 100% nhé ạ. Cảm ơn anh/chị đã phản hồi để shop cải thiện ạ!"`
    : hasShipping
    ? `"Dạ anh/chị ơi, em thành thật xin lỗi vì sự cố đóng gói này ạ 🙏 Shop đã ghi nhận và sẽ báo ngay đơn vị vận chuyển. Nếu sản phẩm bên trong bị ảnh hưởng, anh/chị inbox để em hỗ trợ đổi/hoàn miễn phí nhé. Shop rất trân trọng phản hồi của anh/chị ạ!"`
    : `"Dạ anh/chị ơi, em xin lỗi về trải nghiệm này ạ 🙏 Shop đã ghi nhận phản hồi và sẽ liên hệ anh/chị trong vòng 24h để hỗ trợ. Xin anh/chị thông cảm ạ!"`;

  const replyTemplateRaw = replyTemplate.replace(/<[^>]+>/g, '');

  // ── Mốc thời gian xử lý ──
  const now = new Date();
  const h2 = new Date(now.getTime() + 2*3600000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const h24 = new Date(now.getTime() + 24*3600000).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

  const planEl = document.createElement('div');
  planEl.id = 'crisisResponsePlan';
  planEl.className = 'content-card';
  planEl.style.cssText = `margin-bottom:20px;border:2px solid ${statusColor};`;
  planEl.innerHTML = `
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
      <div>
        <div class="content-card-title" style="margin:0;color:${statusColor};">
          🛡 Kế hoạch Xử lý Khủng hoảng — AI tự động tạo
        </div>
        <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px;">
          Dựa trên ${data.total_neg_reviews} review · ${data.total_risk_tasks} tác vụ rủi ro · ${data.total_chat_signals} tín hiệu chat
          &nbsp;·&nbsp; Tạo lúc ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
      <button onclick="window._lastCrisisData && _renderCrisisResponsePlan(document.getElementById('crisisLivePanel'), window._lastCrisisData)"
        class="btn-modal-cancel" style="font-size:0.72rem;padding:5px 10px;white-space:nowrap;">
        🔄 Làm mới kế hoạch
      </button>
    </div>

    <!-- Tình trạng tổng thể -->
    <div style="background:${statusColor}10;border:1px solid ${statusColor}30;border-radius:10px;
      padding:12px 16px;margin-bottom:14px;display:flex;align-items:flex-start;gap:12px;">
      <span style="font-size:1.5rem;line-height:1;">${topCrisis.severity === 'critical' ? '🚨' : '⚠️'}</span>
      <div>
        <div style="font-size:0.82rem;font-weight:800;color:${statusColor};margin-bottom:4px;">
          ${topCrisis.severity === 'critical' ? 'KHẨN CẤP — Cần hành động trong 2-4 giờ' : 'CẦN THEO DÕI — Xử lý trong ngày hôm nay'}
        </div>
        <div style="font-size:0.76rem;color:var(--text-secondary);line-height:1.55;">
          <strong>${data.crises.length} sản phẩm</strong> có tín hiệu tiêu cực.
          Nghiêm trọng nhất: <code style="background:var(--bg-glass);padding:1px 6px;border-radius:4px;font-size:0.72rem;">${topCrisis.product_id}</code>
          (Score: <strong style="color:${statusColor};">${topCrisis.severity_score}/100</strong>).
          Deadline phản hồi đề xuất: <strong>${h2}</strong> — Hoàn tất xử lý trước: <strong>${h24}</strong>.
        </div>
      </div>
    </div>

    <!-- Bước 1: Hành động ngay -->
    <div style="margin-bottom:14px;">
      <div style="font-size:0.78rem;font-weight:800;color:var(--text-primary);margin-bottom:8px;
        display:flex;align-items:center;gap:8px;">
        <span style="background:#ef4444;color:white;padding:2px 9px;border-radius:6px;font-size:0.67rem;font-weight:800;">NGAY · 0–4h</span>
        Hành động ngay lập tức
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;">
        ${immediateActions.map((a, i) => `
          <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 12px;
            background:rgba(239,68,68,0.05);border-radius:8px;border-left:3px solid #ef4444;">
            <span style="min-width:20px;height:20px;background:#ef4444;color:white;border-radius:50%;
              font-size:0.68rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">${i+1}</span>
            <span style="font-size:0.77rem;color:var(--text-secondary);line-height:1.55;">${a}</span>
          </div>`).join('')}
      </div>
    </div>

    <!-- Bước 2: Trung hạn -->
    <div style="margin-bottom:14px;">
      <div style="font-size:0.78rem;font-weight:800;color:var(--text-primary);margin-bottom:8px;
        display:flex;align-items:center;gap:8px;">
        <span style="background:#f59e0b;color:white;padding:2px 9px;border-radius:6px;font-size:0.67rem;font-weight:800;">1–7 NGÀY</span>
        Xử lý trung hạn
      </div>
      <div style="display:flex;flex-direction:column;gap:5px;">
        ${midTermActions.map((a, i) => `
          <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 12px;
            background:rgba(245,158,11,0.05);border-radius:8px;border-left:3px solid #f59e0b;">
            <span style="min-width:20px;height:20px;background:#f59e0b;color:white;border-radius:50%;
              font-size:0.68rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">${i+1}</span>
            <span style="font-size:0.77rem;color:var(--text-secondary);line-height:1.55;">${a}</span>
          </div>`).join('')}
      </div>
    </div>

    <!-- Template phản hồi review -->
    <div>
      <div style="font-size:0.78rem;font-weight:800;color:var(--text-primary);margin-bottom:8px;
        display:flex;align-items:center;gap:8px;">
        <span style="background:#6366f1;color:white;padding:2px 9px;border-radius:6px;font-size:0.67rem;font-weight:800;">TEMPLATE</span>
        Mẫu phản hồi review công khai — sẵn sàng copy
      </div>
      <div style="background:var(--bg-secondary);border:1px dashed var(--border-primary);border-radius:10px;padding:14px;position:relative;">
        <div id="crisisReplyTemplate" style="font-size:0.8rem;color:var(--text-secondary);line-height:1.75;font-style:italic;">
          ${replyTemplate}
        </div>
        <button onclick="navigator.clipboard?.writeText(${JSON.stringify(replyTemplateRaw)}).then(()=>showToast('✅ Đã copy template phản hồi!','success')).catch(()=>showToast('⚠️ Trình duyệt chặn clipboard — hãy copy thủ công','warning'))"
          style="margin-top:10px;font-size:0.72rem;padding:5px 14px;border-radius:7px;cursor:pointer;
            border:1px solid var(--accent-indigo);background:rgba(99,102,241,0.08);
            color:var(--accent-indigo);font-weight:600;">
          📋 Copy template
        </button>
      </div>
    </div>`;

  // Chèn ngay sau crisisLivePanel
  const crisisPanel = document.getElementById('crisisLivePanel');
  if (crisisPanel?.parentElement) {
    crisisPanel.parentElement.insertBefore(planEl, crisisPanel.nextSibling);
  } else {
    // Fallback: chèn vào pageContent
    const pc = document.getElementById('pageContent');
    if (pc) pc.insertBefore(planEl, pc.firstChild);
  }
}

/* ──────────────────────────────────────────────────────────────────────
   13. CONTENT SUGGESTIONS — Sinh đề xuất từ Báo cáo Hàng ngày
   ────────────────────────────────────────────────────────────────────── */

/**
 * Phân tích dữ liệu báo cáo hàng ngày (hoặc MOCK khi offline)
 * → sinh đề xuất content có cấu trúc → inject vào MOCK.content_suggestions_generated
 * → navigate sang trang "content-suggestions".
 *
 * @param {object|null} summaryData  - kết quả từ /daily-summary, null = dùng MOCK thuần
 */
function generateContentSuggestionsFromSummary(summaryData) {
  if (typeof MOCK === 'undefined') return;

  // Xóa các suggestion đã generated trước đó để tránh trùng
  MOCK.content_suggestions_generated =
    MOCK.content_suggestions_generated.filter(s => !s._fromDailySummary);

  const ts = Date.now();
  const newSugs = [];

  // ── Helpers ─────────────────────────────────────────────────────────
  const detectType = (text) => {
    const t = (text || '').toLowerCase();
    if (t.includes('video') || t.includes('quay') || t.includes('tiktok') || t.includes('youtube')) return 'video';
    if (t.includes('so sánh') || t.includes('compare') || t.includes(' vs ')) return 'comparison';
    if (t.includes('faq') || t.includes('blog') || t.includes('hướng dẫn') || t.includes('câu hỏi') || t.includes('giải đáp')) return 'blog_faq';
    return 'guide';
  };

  const platformFor = (type) => ({
    video: 'TikTok + YouTube', blog_faq: 'Blog + Website',
    comparison: 'Blog + YouTube', guide: 'Website + Shopee'
  }[type] || 'Đa nền tảng');

  const prodTimeFor = (type) => ({
    video: '1-2 ngày quay + editing', blog_faq: '2-4 giờ viết + review',
    comparison: '1 ngày nghiên cứu + viết', guide: '3-5 giờ thiết kế/viết'
  }[type] || '1-2 ngày');

  const findCluster = (keyword) => {
    if (!Array.isArray(MOCK.chat_clusters)) return null;
    const kw = (keyword || '').toLowerCase();
    return MOCK.chat_clusters.find(cl =>
      cl.label.toLowerCase().split(' ').some(w => w.length > 3 && kw.includes(w))
    ) || null;
  };

  const findNegReviews = (keyword) => {
    if (!Array.isArray(MOCK.reviews)) return [];
    const kw = (keyword || '').toLowerCase().split(/\s+/)[0];
    return MOCK.reviews.filter(r =>
      r.rating <= 3 &&
      ((r.text || '').toLowerCase().includes(kw) || (r.product_id || '').toLowerCase().includes(kw))
    );
  };

  const buildSug = ({ id, taskText, source, urgency, dateLabel }) => {
    const type = detectType(taskText);
    const cluster = findCluster(taskText);
    const negRevs = findNegReviews(taskText);

    let score = urgency === 'high' ? 83 : 66;
    if (cluster?.urgent) score += 10;
    if (negRevs.length > 0) score += Math.min(negRevs.length * 4, 12);
    score = Math.min(99, score);

    const chatCount = cluster ? cluster.count : Math.max(3, Math.round(score / 8));
    const chatTopic = cluster ? cluster.label : taskText.split('—')[0].trim().substring(0, 50);
    const sampleQs = cluster
      ? [`"${cluster.label}"`, `Khách hỏi về ${cluster.label.toLowerCase().split(' ').slice(0, 3).join(' ')}`]
      : [`"${taskText.substring(0, 45)}"`, 'Khách phản ánh vấn đề liên quan'];
    const sampleRevs = negRevs.slice(0, 2).map(r => (r.text || '').substring(0, 60) + (r.text?.length > 60 ? '...' : ''));

    return {
      id,
      priority: score >= 80 ? 'high' : 'medium',
      status: 'pending',
      type,
      title: taskText,
      platform: platformFor(type),
      chatbot_signal: { count: chatCount, topic: chatTopic, sample_questions: sampleQs },
      review_signal: {
        count: negRevs.length,
        neg_pct: negRevs.length > 0 ? Math.min(99, 45 + negRevs.length * 12) : 0,
        sample_reviews: sampleRevs
      },
      combined_score: score,
      estimated_impact: `Giảm ~${Math.round(chatCount * 2.2)}% câu hỏi liên quan · tăng CR ${score >= 80 ? '8–12%' : '4–7%'}`,
      estimated_production: prodTimeFor(type),
      angle: `Nguồn: báo cáo ${dateLabel}. Ưu tiên dựa trên ${cluster ? `${chatCount} câu chatbot` : 'phân tích tín hiệu'}${negRevs.length > 0 ? ` + ${negRevs.length} review tiêu cực` : ''}.`,
      _fromDailySummary: true,
      _source: source
    };
  };

  // ── Case 1: Có dữ liệu từ backend ───────────────────────────────────
  if (summaryData) {
    const dateLabel = summaryData.date || 'hôm nay';
    const contentTasks = summaryData.growth_strategy?.content_optimizations || [];
    const riskActions  = (summaryData.risk_management?.urgent_actions || [])
      .filter(t => /nội dung|content|thông tin|mô tả|faq|video/i.test(t));
    const insights     = summaryData.customer_sentiment_overview || [];

    // Từ content_optimizations
    contentTasks.forEach((task, i) => {
      newSugs.push(buildSug({ id: `daily-co-${ts}-${i}`, taskText: task, source: 'content_optimization', urgency: 'medium', dateLabel }));
    });

    // Từ urgent_actions liên quan content
    riskActions.forEach((task, i) => {
      if (!newSugs.some(s => s.title.toLowerCase().includes(task.toLowerCase().split(' ')[2]))) {
        newSugs.push(buildSug({ id: `daily-ra-${ts}-${i}`, taskText: task, source: 'risk_action', urgency: 'high', dateLabel }));
      }
    });

    // Từ customer_sentiment_overview — nhóm theo từ khoá
    const insightMap = {};
    insights.forEach(ins => {
      const kw = /pin|sạc/.test(ins) ? 'pin/sạc'
               : /cáp|dây/.test(ins) ? 'cáp sạc'
               : /giao|ship/.test(ins) ? 'giao hàng'
               : /bảo hành/.test(ins) ? 'bảo hành'
               : /auth|hàng thật|chính hãng/.test(ins) ? 'hàng auth'
               : 'chung';
      (insightMap[kw] = insightMap[kw] || []).push(ins);
    });
    Object.entries(insightMap).forEach(([kw, arr], i) => {
      // Chỉ tạo nếu đủ tín hiệu và chưa bị cover bởi contentTasks
      const alreadyCovered = newSugs.some(s => s.title.toLowerCase().includes(kw.split('/')[0]));
      if (!alreadyCovered && arr.length >= 2) {
        const type = /video|quay/.test(arr.join(' ')) ? 'video' : 'blog_faq';
        const score = Math.min(99, 58 + arr.length * 5);
        newSugs.push({
          id: `daily-ins-${ts}-${i}`,
          priority: score >= 75 ? 'high' : 'medium',
          status: 'pending',
          type,
          title: `FAQ: Giải đáp loạt câu hỏi về "${kw}" — ${arr.length} insight từ chatbot`,
          platform: platformFor(type),
          chatbot_signal: { count: arr.length * 4, topic: `Khách hỏi về ${kw}`, sample_questions: arr.slice(0, 2) },
          review_signal: { count: 0, neg_pct: 0, sample_reviews: [] },
          combined_score: score,
          estimated_impact: `Giải đáp trực tiếp ${arr.length * 4}+ câu hỏi tương tự từ chatbot trong ngày`,
          estimated_production: prodTimeFor(type),
          angle: `Tổng hợp ${arr.length} insight hôm nay về "${kw}": ${arr.slice(0, 2).join(' | ')}`,
          _fromDailySummary: true,
          _source: 'sentiment_insight'
        });
      }
    });

  // ── Case 2: Offline / Demo mode — phân tích từ MOCK data ────────────
  } else {
    const dateLabel = new Date().toLocaleDateString('vi-VN');

    // Từ chat_clusters (urgent + lớn)
    (MOCK.chat_clusters || [])
      .filter(cl => cl.urgent || cl.count >= 10)
      .forEach((cl, i) => {
        const negRevs = findNegReviews(cl.label);
        const type = detectType(cl.label + ' ' + (cl.action || ''));
        const score = Math.min(99, (cl.urgent ? 86 : 68) + Math.min(negRevs.length * 4, 10));
        newSugs.push({
          id: `mock-cl-${ts}-${i}`,
          priority: cl.urgent ? 'high' : 'medium',
          status: 'pending',
          type,
          title: `${cl.icon || '📝'} ${cl.action} — "${cl.label}"`,
          platform: platformFor(type),
          chatbot_signal: { count: cl.count, topic: cl.label, sample_questions: [`"${cl.label}"`, `Khách hỏi về ${cl.label.split(' ').slice(0, 3).join(' ')}`] },
          review_signal: { count: negRevs.length, neg_pct: negRevs.length > 0 ? 65 : 0, sample_reviews: negRevs.slice(0, 2).map(r => (r.text || '').substring(0, 60)) },
          combined_score: score,
          estimated_impact: cl.impact || `Giảm ~${Math.round(cl.count * 2.1)}% câu hỏi về "${cl.label}"`,
          estimated_production: prodTimeFor(type),
          angle: `Demo mode — ${cl.count} khách hỏi chủ đề này. Hành động: ${cl.action}`,
          _fromDailySummary: true,
          _source: 'mock_cluster'
        });
      });

    // Từ reviews tiêu cực nhóm theo product
    const byProduct = {};
    (MOCK.reviews || []).filter(r => r.rating <= 2).forEach(r => {
      const pid = r.product_id || 'General';
      (byProduct[pid] = byProduct[pid] || []).push(r);
    });
    Object.entries(byProduct).forEach(([pid, revs], i) => {
      const alreadyCovered = newSugs.some(s =>
        s.title.toLowerCase().includes(pid.toLowerCase().replace(/-/g, ' ').split(' ')[0])
      );
      if (!alreadyCovered) {
        const score = Math.min(99, 62 + revs.length * 9);
        newSugs.push({
          id: `mock-rv-${ts}-${i}`,
          priority: revs.length >= 2 ? 'high' : 'medium',
          status: 'pending',
          type: 'guide',
          title: `📢 Nội dung xử lý phản hồi tiêu cực — ${pid.replace(/-/g, ' ')}`,
          platform: 'Shopee + Website',
          chatbot_signal: { count: revs.length * 3, topic: `Phàn nàn về ${pid}`, sample_questions: revs.slice(0, 2).map(r => `"${(r.text || '').substring(0, 45)}"`) },
          review_signal: { count: revs.length, neg_pct: 100, sample_reviews: revs.slice(0, 2).map(r => (r.text || '').substring(0, 60)) },
          combined_score: score,
          estimated_impact: 'Khôi phục rating sản phẩm + giảm churn rate',
          estimated_production: '2-4 giờ viết FAQ + template phản hồi review',
          angle: `${revs.length} review tiêu cực gần đây. Tạo FAQ giải đáp + mẫu phản hồi chuẩn cho ${pid}.`,
          _fromDailySummary: true,
          _source: 'mock_review'
        });
      }
    });
  }

  if (newSugs.length === 0) {
    showToast('ℹ️ Không tìm thấy tín hiệu content đủ mạnh để tạo đề xuất mới.', 'info');
    return;
  }

  // Sắp xếp giảm dần theo score
  newSugs.sort((a, b) => b.combined_score - a.combined_score);

  // Inject vào đầu danh sách (trước các suggestion MOCK gốc)
  MOCK.content_suggestions_generated = [...newSugs, ...MOCK.content_suggestions_generated];

  const highCount = newSugs.filter(s => s.priority === 'high').length;

  // Toast thông báo + navigate
  showToast(
    `✅ Đã tạo <strong>${newSugs.length} đề xuất content</strong>${highCount > 0 ? ` (${highCount} ưu tiên cao)` : ''} từ báo cáo — Đang chuyển sang trang Content...`,
    'success'
  );
  setTimeout(() => navigate('content-suggestions'), 700);
}

/* ──────────────────────────────────────────────────────────────────────
   12. INIT
   ────────────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {
  // Kiểm tra kết nối backend sau khi trang load
  setTimeout(checkBackendHealth, 1800);
});

console.log(
  '%c🚀 Agicom API Integration v1.0 loaded',
  'color:#eab308;font-weight:bold;font-size:13px;'
);
console.log('%cBackend URL:', 'color:#94a3b8', API_BASE);
console.log(
  '%cĐể đổi backend URL, set: window.AGICOM_API_BASE = "https://your-backend.com"',
  'color:#94a3b8;font-style:italic'
);
