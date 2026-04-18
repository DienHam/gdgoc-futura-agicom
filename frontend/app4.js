/* =====================================================================
   Agicom Dashboard v2.0 - Complete App Logic
   Multi-Agent E-commerce Assistant for Vietnamese SMEs
   ===================================================================== */

/* =====================================================================
   1. MOCK DATA
   ===================================================================== */
const MOCK = {
  shop: {
    name: 'Shop PhoneMax',
    plan: 'Premium AI',
    id: '#88902',
    target_revenue_month: 3200000000, // 3.2 tỷ
    current_revenue_month: 2120000000,
    margin_floor: 8, // %
    roas_floor: 3.0
  },

  // KPIs with sparkline data (last 7 days)
  kpis: {
    revenue: { value: 120500000, trend: 15, sparkline: [40, 60, 50, 80, 70, 100, 90], target: 120000000, current: 102000000 },
    orders: { value: 450, trend: 5, sparkline: [55, 62, 58, 70, 65, 80, 75] },
    cr: { value: 3.2, trend: -0.5, sparkline: [3.5, 3.6, 3.4, 3.3, 3.4, 3.2, 3.2], warning: true },
    aov: { value: 266000, trend: 2, sparkline: [250, 255, 260, 258, 262, 268, 266] }
  },

  platforms: [
    { id: 'shopee', name: 'Shopee Mall', share: 65, revenue: 78325000, target_pct: 85, color: '#10b981', connected: true, sku_synced: 234, connected_date: '12/01/2026' },
    { id: 'tiki', name: 'Tiki Trading', share: 15, revenue: 18075000, target_pct: 60, color: '#f59e0b', connected: true, sku_synced: 89, connected_date: '20/02/2026' },
    { id: 'tiktok', name: 'TikTok Shop', share: 0, revenue: 0, target_pct: 0, color: '#0ea5e9', connected: false, sku_synced: 0 },
    { id: 'website', name: 'Website', share: 20, revenue: 24100000, target_pct: 45, color: '#0ea5e9', connected: true, sku_synced: 234, connected_date: '01/01/2026' }
  ],

  // Critical alerts shown on dashboard
  alerts: [
    { level: 'critical', icon: '🔴', text: 'S24 Ultra Case Spigen còn 2 cái — dự kiến hết hàng trong 3 ngày', cta: 'Đặt hàng ngay', cta_page: 'inventory' },
    { level: 'warning', icon: '🟡', text: 'Đối thủ Hoàng Hà vừa giảm giá S24 Ultra -6.5% (10 phút trước)', cta: 'Xem đề xuất', cta_page: 'ai-suggestions' },
    { level: 'warning', icon: '🟡', text: '23 khách hỏi về pin S24 Ultra trong 7 ngày — đề xuất quay video review', cta: 'Xem chi tiết', cta_page: 'reviews' },
    { level: 'info', icon: '🔵', text: 'Tỷ lệ chuyển đổi giảm 0.5% — AI đang phân tích nguyên nhân', cta: 'Xem báo cáo', cta_page: 'ai-performance' },
    { level: 'info', icon: '🔵', text: 'Cáp Anker 100W: 8 review tiêu cực mới — cần phản hồi', cta: 'Trả lời ngay', cta_page: 'reviews' }
  ],

  // AI agent activity today
  ai_today: {
    suggestions_created: 12,
    suggestions_approved: 8,
    suggestions_pending: 3,
    suggestions_rejected: 1,
    chats_handled: 47,
    chats_auto: 43,
    chats_escalated: 4,
    revenue_from_ai: 18500000 // 18.5M
  },

  // Revenue by day (7 days, stacked by platform)
  revenue_7d: [
    { day: 'T2', shopee: 26, tiki: 6, website: 8 },
    { day: 'T3', shopee: 38, tiki: 10, website: 12 },
    { day: 'T4', shopee: 32, tiki: 8, website: 10 },
    { day: 'T5', shopee: 52, tiki: 12, website: 16 },
    { day: 'T6', shopee: 45, tiki: 10, website: 15 },
    { day: 'T7', shopee: 65, tiki: 15, website: 20 },
    { day: 'CN', shopee: 58, tiki: 13, website: 19 }
  ],

  // P&L
  pnl: [
    { label: '1. Doanh thu gộp', value: 850000000, change: 5, trend: 'up' },
    { label: '2. Giá vốn hàng bán (COGS)', value: 610000000, change: 3, trend: 'neutral' },
    { label: '3. Phí Sàn (Shopee + TikTok)', value: 59500000, change: 7, trend: 'down' },
    { label: '4. Phí Quảng Cáo & Media', value: 42000000, change: 5, trend: 'neutral' },
    { label: '5. Phí Vận hành (Hộp, Băng keo)', value: 8500000, change: 1, trend: 'neutral' },
    { label: 'LỢI NHUẬN RÒNG (NET)', value: 130000000, change: 8, trend: 'up', highlight: true, margin: 15.3 },
    { label: 'Break-even point (cần đạt/ngày)', value: 23300000, change: 0, trend: 'neutral', italic: true }
  ],

  margin_by_product: [
    { name: 'Ốp lưng Silicon', margin: 45, color: '#10b981' },
    { name: 'Cáp sạc Baseus', margin: 38, color: '#10b981' },
    { name: 'AirPods Pro 2', margin: 12, color: '#f59e0b' },
    { name: 'iPhone 15 Pro Max', margin: 8, color: '#ef4444' }
  ],

  // Inventory
  inventory_kpis: {
    total: 2450,
    value: 1800000000,
    low_stock: 5,
    slow_moving: 12,
    turnover_days: 18
  },

  inventory_low: [
    { sku: 'S24 Ultra Case Spigen', qty: 2, days: 3, ai_action: 'Đặt 50 cái — lead time 7 ngày' },
    { sku: 'Cáp Anker 100W', qty: 5, days: 4, ai_action: 'Đặt 100 cái — đang trending' },
    { sku: 'Củ sạc Ugreen 65W', qty: 8, days: 7, ai_action: 'Đặt 80 cái' }
  ],

  inventory_slow: [
    { sku: 'Mi Band 7 Xanh', qty: 45, days: 80, ai_reason: 'Review trung bình 3.2★, đối thủ giá rẻ hơn 15%', ai_action: 'Giảm 25% + Flash Sale cuối tuần' },
    { sku: 'Ốp lưng IP13 Thường', qty: 120, days: 65, ai_reason: 'Mẫu cũ, IP13 không còn trending', ai_action: 'Combo với cáp sạc giảm 20%' }
  ],

  // Competitors
  competitors: [
    { name: 'MobileWorld Store', activity: 'Vừa giảm giá iPhone 15 PM (-500k)', time: '10 phút trước', color: '#ef4444' },
    { name: 'TechZone', activity: 'Mở campaign Flash Sale cuối tuần', time: '2 giờ trước', color: '#f59e0b' },
    { name: 'Hoàng Hà', activity: 'Hết hàng mã Buds3 Pro', time: 'Hôm qua', color: '#10b981' }
  ],

  competitor_products: ['Galaxy S24 Ultra', 'iPhone 15 Pro Max', 'AirPods Pro 2', 'Galaxy Buds3 Pro', 'Cáp Anker 100W'],

  competitor_prices: {
    'Galaxy S24 Ultra': {
      history: [29490000, 29490000, 29200000, 29200000, 28990000, 28990000, 28490000],
      shops: [
        { name: 'Shop Của Bạn', old: null, new: 29990000, gap: 0 },
        { name: 'Hoàng Hà', old: 30490000, new: 28490000, gap: -5.0 },
        { name: 'CellphoneS', old: 28990000, new: 28990000, gap: -3.3 },
        { name: 'MobileWorld', old: 29200000, new: 28800000, gap: -4.0 }
      ]
    }
  },

  // Reviews
  reviews_kpi: { rating: 4.85, count: 12450, positive: 85, neutral: 10, negative: 5, trend_pos: 3 },

  review_tags_pos: ['Giao siêu nhanh', 'Hàng auth hộp đẹp', 'Tư vấn nhiệt tình'],
  review_tags_neg: ['Shipper thái độ', 'Cáp bị gập', 'Đóng gói móp'],

  reviews: [
    { author: 'khachhang_vip', date: 'Hôm qua', rating: 2, text: 'Giao hàng hộp bị móp nặng, may mà bên trong điện thoại không sao. Mong shop nhắc bên vận chuyển cẩn thận hơn.', tag: { type: 'neg', label: 'Đóng gói / Vận chuyển' } },
    { author: 'nguyentuan123', date: '2 ngày trước', rating: 5, text: 'Máy móc thì ngon lành, nguyên seal. Nhưng mà shop tư vấn siêu nhiệt tình, tôi hỏi đủ thứ móp méo lúc 1h sáng mà bot vẫn rep mượt như người thật =))) 10 điểm.', tag: { type: 'pos', label: 'AI Chat Support' } },
    { author: 'minhnguyet', date: '3 ngày trước', rating: 1, text: 'Cáp Anker 100W xài 1 tuần đã hư, sạc rất chậm. Yêu cầu hoàn tiền!', tag: { type: 'neg', label: 'Chất lượng SP' } }
  ],

  // Media & Ads
  ads_kpi: { budget_week: 15000000, spent: 8200000, revenue: 64000000, roas: 7.8 },

  ads_campaigns: [
    { name: 'Tai nghe AirPods Pro 2', channel: 'Shopee Search', cost: 4000000, conv: 45, roas: 12.5, action: 'scale', ai_reason: 'ROAS 12.5x > ngưỡng 10x → đề xuất tăng budget 30%' },
    { name: 'Sạc Baseus Type-C', channel: 'TikTok Video', cost: 2500000, conv: 112, roas: 8.2, action: 'maintain', ai_reason: 'ROAS ổn định trong vùng tối ưu' },
    { name: 'Ốp Silicon chống bẩn', channel: 'Shopee Discovery', cost: 1700000, conv: 8, roas: 0.8, action: 'cut', ai_reason: 'ROAS 0.8x < 3.0x → đề xuất tắt campaign, redirect budget' }
  ],

  // AI Suggestions
  suggestions: [
    {
      id: 'sug-001', type: 'price', status: 'pending', time: '5 phút trước',
      title: 'Giảm giá S24 Ultra 4% + tặng ốp Spigen',
      reason: 'Đối thủ Hoàng Hà vừa giảm 6.5%. 7 khách VIP đã xem SP nhưng chưa chốt. Tồn kho còn 12 đơn vị.',
      metrics: [{label: 'Doanh thu dự kiến', value: '+22M'}, {label: 'Margin sau giảm', value: '11%'}, {label: 'Đơn hàng dự kiến', value: '+5-7'}],
      confidence: 87
    },
    {
      id: 'sug-002', type: 'content', status: 'pending', time: '12 phút trước',
      title: 'Cập nhật mô tả AirPods Pro 2 — thêm bảng pin',
      reason: '23 khách hỏi về thời lượng pin trong 7 ngày qua. Tỷ lệ chốt sau khi hỏi pin chỉ 12% (thấp hơn mức TB 28%).',
      metrics: [{label: 'CR dự kiến tăng', value: '+8%'}, {label: 'Câu hỏi giảm', value: '-60%'}],
      confidence: 92
    },
    {
      id: 'sug-003', type: 'promo', status: 'pending', time: '1 giờ trước',
      title: 'Flash Sale Mi Band 7 — giảm 25%',
      reason: 'Tồn kho 80 ngày. Review TB 3.2★ thấp. Không xả gấp sẽ thành hàng tồn quý 2.',
      metrics: [{label: 'Thu hồi vốn', value: '~28M'}, {label: 'Margin', value: '5%'}, {label: 'SKU xả', value: '45 cái'}],
      confidence: 78
    },
    {
      id: 'sug-004', type: 'ads', status: 'approved', time: '2 giờ trước',
      title: 'Tăng budget AirPods Pro 2 +30%',
      reason: 'ROAS 12.5x duy trì 5 ngày. Tăng budget có thể scale doanh thu tuyến tính.',
      metrics: [{label: 'Doanh thu dự kiến', value: '+18M'}, {label: 'ROAS dự báo', value: '11.2x'}],
      confidence: 94
    },
    {
      id: 'sug-005', type: 'cs', status: 'approved', time: '3 giờ trước',
      title: 'Gửi tin proactive cho 7 khách quan tâm S24 Ultra',
      reason: 'Đối thủ đang giảm giá, 7 khách VIP đã inbox hỏi nhưng chưa chốt.',
      metrics: [{label: 'Khách target', value: '7'}, {label: 'CR dự kiến', value: '40%'}],
      confidence: 81
    },
    {
      id: 'sug-006', type: 'price', status: 'rejected', time: 'Hôm qua',
      title: 'Giảm giá Galaxy Buds3 Pro 10%',
      reason: 'Đối thủ TechZone giảm giá. Inventory cao.',
      metrics: [{label: 'Doanh thu', value: '+12M'}, {label: 'Margin', value: '4%'}],
      confidence: 65,
      rejection_reason: 'Margin còn 4% là quá thấp, không đủ bù phí ship.'
    }
  ],

  // Chat conversations
  conversations: [
    {
      id: 'c1', name: 'Nguyễn Thị A', avatar: 'N', time: '10:05', status: 'auto', unread: 0,
      preview: 'Sắp có hàng Shopee Mall chưa shop?',
      category: 'Hỏi hàng', sentiment: 72, wait_min: 0, priority: 2,
      ltv: 3200000, orders: 2, platform: 'Shopee',
      customer: { note: 'Khách mới, tiềm năng trung bình', risk: 'low', churn: '8%',
        purchases: [{ date: '10/03', item: 'Ốp lưng Samsung', value: 350000 }] }
    },
    {
      id: 'c2', name: 'Trần Văn B', avatar: 'T', time: '09:45', status: 'pending', unread: 1,
      preview: 'Mua 3 cái có bớt không?',
      category: 'Thương lượng giá', sentiment: 68, wait_min: 18, priority: 1,
      ltv: 12500000, orders: 5, platform: 'Shopee', vip: true,
      customer: { note: 'Khách VIP — đã mua 5 đơn Samsung, có xu hướng mua bulk', risk: 'low', churn: '5%',
        purchases: [
          { date: '15/03', item: 'Galaxy S23 Ultra', value: 28900000 },
          { date: '20/02', item: 'Ốp Spigen x2', value: 700000 },
          { date: '10/01', item: 'Cáp Anker 100W', value: 350000 }
        ] }
    },
    {
      id: 'c3', name: 'Lê C', avatar: 'L', time: '09:12', status: 'escalate', unread: 1,
      preview: 'Làm ăn dối trá, hàng giả à?',
      category: 'Khiếu nại — Bảo hành', sentiment: 4, wait_min: 51, priority: 0,
      ltv: 28900000, orders: 1, platform: 'Shopee', angry: true,
      customer: { note: '⚠ Đơn hàng #SP-2401-892 — AirPods Pro 2, mua 5 ngày trước, bảo hành còn 12 tháng', risk: 'high', churn: '82%',
        purchases: [{ date: '08/04', item: 'AirPods Pro 2', value: 5200000 }] }
    },
    {
      id: 'c4', name: 'Phạm Hương', avatar: 'P', time: '08:50', status: 'auto', unread: 0,
      preview: 'Shop ơi',
      category: 'Khách quay lại', sentiment: 80, wait_min: 0, priority: 2,
      ltv: 7400000, orders: 3, platform: 'Tiki', returning: true,
      customer: { note: 'Khách quen — lần cuối hỏi hộp sạc rời chưa mua. Đang có deal -15%', risk: 'medium', churn: '24%',
        purchases: [
          { date: '15/02', item: 'AirPods Pro 2', value: 5200000 },
          { date: '10/01', item: 'Cáp Lightning', value: 250000 }
        ] }
    },
    {
      id: 'c5', name: 'Hoàng Mạnh', avatar: 'H', time: '08:32', status: 'escalate', unread: 1,
      preview: 'Cáp xài 1 tuần hư rồi',
      category: 'Khiếu nại — Chất lượng SP', sentiment: 12, wait_min: 71, priority: 0,
      ltv: 890000, orders: 1, platform: 'TikTok', angry: true,
      customer: { note: '⚠ Cùng vấn đề với 7 khách khác — Cáp Anker 100W lô T03/2026 có thể lỗi', risk: 'high', churn: '90%',
        purchases: [{ date: '07/04', item: 'Cáp Anker 100W', value: 350000 }] }
    },
    {
      id: 'c6', name: 'Vũ Linh', avatar: 'V', time: '08:15', status: 'auto', unread: 0,
      preview: 'Cảm ơn shop nhiều ạ ❤️',
      category: 'Phản hồi tích cực', sentiment: 98, wait_min: 0, priority: 3,
      ltv: 4100000, orders: 2, platform: 'Shopee',
      customer: { note: 'Khách hài lòng cao — tiềm năng upsell', risk: 'low', churn: '6%',
        purchases: [{ date: '12/04', item: 'Galaxy Buds3 Pro', value: 3200000 }] }
    }
  ],

  // Issue clusters from AI pattern detection
  chat_clusters: [
    { icon: '🔴', label: 'Cáp Anker 100W lỗi', count: 8, impact: 'Cao — rủi ro khủng hoảng', action: 'Tạm dừng bán + liên hệ NCC', urgent: true },
    { icon: '🟡', label: 'Hỏi thời lượng pin S24 Ultra', count: 23, impact: 'Mất ~30% cơ hội chốt đơn', action: 'Quay video test pin 24h', urgent: false },
    { icon: '🟡', label: 'Hỏi hàng auth, tem chính hãng', count: 17, impact: 'Giảm tỷ lệ tin tưởng', action: 'Thêm video unbox + tem vào ảnh SP', urgent: false },
    { icon: '🔵', label: 'Hỏi giá sỉ từ 5 máy trở lên', count: 12, impact: 'Cơ hội B2B mới', action: 'Tạo bảng giá sỉ chính thức', urgent: false },
    { icon: '🔵', label: 'Phàn nàn hộp bị móp khi ship', count: 8, impact: 'Ảnh hưởng review', action: 'Đổi thùng carton 5 lớp (+2k/đơn)', urgent: false }
  ],

  // Proactive targets — khách cần chủ động nhắn
  proactive_targets: [
    { name: 'Trần Văn B', reason: 'Đối thủ giảm giá S24 Ultra — khách VIP chưa chốt 3 máy', value: '86M tiềm năng', action: 'Gửi offer ngay' },
    { name: 'Phạm Thị Lan', reason: 'Đã hỏi AirPods Pro 2 (10/4) — hiện đang flash sale -8%', value: '5.2M tiềm năng', action: 'Gửi thông báo' },
    { name: 'Hoàng Đức', reason: 'Đơn hàng #TK-890 ship 5 ngày, chưa nhận — rủi ro khiếu nại', value: 'Phòng ngừa complaint', action: 'Chủ động hỏi thăm' }
  ],

  // Crisis data
  crises: [
    {
      id: 'cr-001',
      product: 'Cáp Anker 100W',
      sku: 'SKU-ANK-100W',
      severity: 'critical',  // critical | warning | monitoring
      status: 'active',      // active | in_progress | resolved
      detected_at: '07:12, 15/04/2026',
      revenue_at_risk: 28000000,
      affected_customers: 8,
      severity_score: 91,

      // Signal từ từng agent
      signals: [
        {
          agent: 'Market Agent',
          icon: '📊',
          color: '#ef4444',
          title: '3 review 1 sao mới trên Shopee',
          detail: 'Tất cả đề cập "sạc cực chậm sau 1 tuần dùng" — xuất hiện trong 6 giờ qua',
          detected_at: '06:45',
          evidence: [
            { type: 'review', author: 'user_abc', text: 'Cáp xài 1 tuần là chết, sạc rất chậm', rating: 1 },
            { type: 'review', author: 'hoangmanh92', text: 'Hàng lỗi, pin không vào', rating: 1 },
            { type: 'review', author: 'lanpham_hcm', text: 'Mua về 10 ngày tự dưng không sạc được', rating: 1 }
          ]
        },
        {
          agent: 'Chat Agent',
          icon: '💬',
          color: '#f59e0b',
          title: '5 khách inbox phàn nàn cùng vấn đề',
          detail: 'Pattern: "cáp + không sạc / chậm" — cùng lô hàng T03/2026',
          detected_at: '07:02',
          evidence: [
            { type: 'chat', author: 'Hoàng Mạnh', text: 'Cáp xài 1 tuần hư rồi', time: '08:32' },
            { type: 'chat', author: 'Lê Văn C', text: 'Mua cáp về không sạc được máy', time: '07:55' },
            { type: 'chat', author: 'Nguyễn T.D', text: 'Cáp bị lỗi, sạc không vào pin', time: '07:41' },
            { type: 'chat', author: 'Trịnh Hoa', text: 'Đổi trả giúp em, cáp hỏng rồi', time: '07:20' },
            { type: 'chat', author: 'Vũ Đình K', text: 'Cáp mua 5 ngày sạc cực chậm', time: '06:58' }
          ]
        },
        {
          agent: 'Content Agent',
          icon: '🎵',
          color: '#0ea5e9',
          title: '1 video TikTok viral chê sản phẩm',
          detail: '@techreview_vn đăng video "Cáp Anker 100W hàng shop X bị lỗi" — đang lan nhanh',
          detected_at: '07:10',
          evidence: [
            { type: 'tiktok', account: '@techreview_vn', views: 52000, likes: 3400,
              comments: 287, text: '"Test thực tế: Cáp Anker 100W mua ở shop X — sau 1 tuần sạc cực chậm, đo thực tế chỉ còn 18W thay vì 100W"',
              trend: 'Tăng 12k views/giờ' }
          ]
        }
      ],

      // Orchestrator analysis
      orchestrator: {
        root_cause: 'Lô hàng Cáp Anker 100W nhập tháng 3/2026 (batch T03) có khả năng lỗi chip sạc — dẫn đến tụt hiệu suất sau 5-10 ngày sử dụng. Cần kiểm tra QC toàn bộ lô.',
        revenue_projection: 'Nếu không xử lý trong 24h: ước tính mất thêm 15-20 khách, doanh thu rủi ro ~65M, rating Shopee giảm 0.3★',
        confidence: 94
      },

      // Action checklist
      actions: [
        {
          id: 'act-1', order: 1, priority: 'critical',
          title: 'Tạm dừng quảng cáo Cáp Anker 100W',
          detail: 'Dừng ngay 2 campaign đang chạy trên Shopee Search và TikTok để tránh thu hút thêm khách mua hàng lỗi',
          status: 'done',
          done_by: 'AI Agent', done_at: '07:13',
          draft: null
        },
        {
          id: 'act-2', order: 2, priority: 'critical',
          title: 'Ẩn sản phẩm khỏi gian hàng tạm thời',
          detail: 'Không cho phép đặt hàng mới cho đến khi xác nhận vấn đề lô hàng',
          status: 'pending',
          draft: null
        },
        {
          id: 'act-3', order: 3, priority: 'high',
          title: 'Gửi voucher xin lỗi 8 khách bị ảnh hưởng',
          detail: '8 khách đã mua lô T03 — gửi voucher 50k + tin nhắn xin lỗi cá nhân hoá',
          status: 'pending',
          draft: 'Chào anh/chị [Tên], shop PhoneMax thành thật xin lỗi về sự cố với sản phẩm Cáp Anker 100W anh/chị đã mua. Chúng tôi đã phát hiện lỗi trong lô hàng này và đang xử lý gấp. Shop xin gửi anh/chị voucher 50.000đ áp dụng cho đơn hàng tiếp theo, và sẵn sàng hỗ trợ đổi/trả sản phẩm miễn phí. Mong anh/chị thông cảm 🙏'
        },
        {
          id: 'act-4', order: 4, priority: 'high',
          title: 'Liên hệ nhà cung cấp kiểm tra QC lô T03/2026',
          detail: 'Email/gọi Anker Vietnam yêu cầu kiểm tra toàn bộ lô T03, xác nhận có lỗi batch hay không',
          status: 'pending',
          draft: 'Kính gửi Anker Vietnam,\n\nChúng tôi ghi nhận 8 phản hồi từ khách hàng về sản phẩm Cáp Anker 100W (lô T03/2026) bị giảm hiệu suất sạc sau 5-10 ngày. Đề nghị kiểm tra QC lô hàng này và phản hồi trong 24 giờ.\n\nShop PhoneMax'
        },
        {
          id: 'act-5', order: 5, priority: 'medium',
          title: 'Soạn thông báo recall lô hàng (nếu NCC xác nhận lỗi)',
          detail: 'Chuẩn bị sẵn thông báo thu hồi để đăng ngay khi có kết quả từ NCC',
          status: 'pending',
          draft: 'THÔNG BÁO: Shop PhoneMax tạm ngừng bán Cáp Anker 100W lô tháng 3/2026 để kiểm tra chất lượng. Khách đã mua sản phẩm trong giai đoạn 01/03-15/04/2026 vui lòng inbox shop để được hỗ trợ đổi hàng hoàn toàn miễn phí.'
        },
        {
          id: 'act-6', order: 6, priority: 'medium',
          title: 'Phản hồi video TikTok @techreview_vn',
          detail: 'Comment chuyên nghiệp dưới video, thể hiện trách nhiệm và cam kết xử lý',
          status: 'pending',
          draft: 'Cảm ơn bạn đã phản hồi. Shop đã ghi nhận và đang kiểm tra kỹ lô hàng này. Bạn hoặc bất kỳ khách nào gặp sự cố tương tự vui lòng inbox shop để được đổi hàng mới 100% miễn phí. Chúng tôi cam kết xử lý trong 24h. Xin lỗi vì sự bất tiện này 🙏'
        }
      ],

      // Affected customers list
      affected_customers_list: [
        { name: 'Hoàng Mạnh', platform: 'TikTok', order_date: '07/04', status: 'Chưa liên hệ', value: 350000 },
        { name: 'Lê Văn C', platform: 'Shopee', order_date: '05/04', status: 'Chưa liên hệ', value: 350000 },
        { name: 'Nguyễn T.D', platform: 'Shopee', order_date: '03/04', status: 'Chưa liên hệ', value: 350000 },
        { name: 'Trịnh Hoa', platform: 'Tiki', order_date: '01/04', status: 'Chưa liên hệ', value: 350000 },
        { name: 'Vũ Đình K', platform: 'Shopee', order_date: '28/03', status: 'Chưa liên hệ', value: 350000 },
        { name: 'user_abc', platform: 'Shopee', order_date: '25/03', status: 'Đã review 1★', value: 350000 },
        { name: 'hoangmanh92', platform: 'Shopee', order_date: '22/03', status: 'Đã review 1★', value: 350000 },
        { name: 'lanpham_hcm', platform: 'Shopee', order_date: '18/03', status: 'Đã review 1★', value: 350000 }
      ],

      // Event timeline
      timeline: [
        { time: '06:45', agent: 'Market Agent', event: 'Phát hiện 3 review 1★ trong 6 giờ — vượt ngưỡng cảnh báo (>2 reviews xấu/6h)' },
        { time: '07:02', agent: 'Chat Agent', event: 'Phát hiện 5 cuộc hội thoại có pattern "cáp + lỗi" — cluster confidence 94%' },
        { time: '07:10', agent: 'Content Agent', event: 'Video TikTok @techreview_vn đạt 52k views — vượt ngưỡng viral (>10k views)' },
        { time: '07:12', agent: 'Orchestrator', event: '3 tín hiệu hội tụ → Severity Score 91/100 → Phát cảnh báo MỨC ĐỎ' },
        { time: '07:13', agent: 'AI Agent', event: 'Tự động dừng 2 campaign quảng cáo đang chạy (đã thực thi)' },
        { time: '07:15', agent: 'System', event: 'Push notification đến chủ shop — đang chờ phê duyệt 5 hành động còn lại' }
      ]
    },
    {
      id: 'cr-002',
      product: 'Mi Band 7 Xanh',
      sku: 'SKU-MIB7-X',
      severity: 'warning',
      status: 'monitoring',
      detected_at: '05:30, 15/04/2026',
      revenue_at_risk: 5800000,
      affected_customers: 3,
      severity_score: 45,
      signals: [
        { agent: 'Market Agent', icon: '📊', color: '#f59e0b',
          title: '2 review 2 sao về pin yếu', detail: 'Chưa đủ ngưỡng cảnh báo đỏ', detected_at: '05:30', evidence: [] },
        { agent: 'Chat Agent', icon: '💬', color: '#94a3b8',
          title: '1 khách hỏi về đổi trả', detail: 'Đơn lẻ, chưa thành pattern', detected_at: '06:10', evidence: [] }
      ],
      orchestrator: { root_cause: 'Đang theo dõi — chưa đủ tín hiệu để xác nhận lỗi batch', revenue_projection: 'Rủi ro thấp nếu xử lý sớm', confidence: 45 },
      actions: [
        { id: 'act-w1', order: 1, priority: 'medium', title: 'Theo dõi thêm 24h', detail: 'Nếu thêm 2 review xấu → tự động escalate lên MỨC ĐỎ', status: 'done', draft: null },
        { id: 'act-w2', order: 2, priority: 'low', title: 'Liên hệ chủ động 3 khách', detail: 'Hỏi thăm trải nghiệm sản phẩm', status: 'pending', draft: 'Chào anh/chị, shop PhoneMax xin hỏi thăm trải nghiệm với Mi Band 7 ạ...' }
      ],
      affected_customers_list: [],
      timeline: [
        { time: '05:30', agent: 'Market Agent', event: 'Phát hiện 2 review 2★ — Severity Score 35' },
        { time: '06:10', agent: 'Chat Agent', event: 'Phát hiện 1 khách hỏi đổi trả — Severity Score tăng lên 45' },
        { time: '06:12', agent: 'Orchestrator', event: 'Severity 45 < 70 → Chuyển sang chế độ Monitoring' }
      ]
    }
  ],

  // Chat detail messages (Trần Văn B - VIP smart pricing demo)
  chat_messages: {
    c2: [
      { from: 'customer', time: '09:44', text: 'Shop ơi mình định lấy 3 cái S24 Ultra, shop có bớt không?' },
      { from: 'ai_thinking', text: 'AI đang phân tích context...', context: [
        '✓ Khách LTV: 12.5M (VIP)', '✓ Lịch sử: 2 đơn Samsung trước đó', '✓ Đối thủ: Hoàng Hà -6.5%',
        '✓ Tồn kho: 4 máy, 12 ngày', '✓ Margin tối thiểu: 8%'
      ]},
      { from: 'ai_draft', text: 'Dạ với khách quen như anh, em ưu đãi giá 28.790k/máy + tặng kèm ốp Spigen chính hãng (giá thị trường 250k) cho 3 máy ạ! Anh chốt giúp em hôm nay nhé 🥰', confidence: 87 }
    ],
    c3: [
      { from: 'customer', time: '09:12', text: 'Làm ăn dối trá, hàng giả à? Mua tuần trước giờ shipper bảo hết bảo hành rồi!' },
      { from: 'ai_thinking', text: 'AI phát hiện cảm xúc tiêu cực mạnh — chuyển sang Reasoning Agent', context: [
        '⚠ Sentiment: Rất tiêu cực (95%)', '✓ Đơn hàng: #SP-2401-892 (5 ngày trước)',
        '✓ Sản phẩm: AirPods Pro 2 — bảo hành 12 tháng', '⚠ Tag: ESCALATE — cần chủ shop xử lý'
      ]},
      { from: 'system', text: '🚨 AI đã gửi tin tạm cho khách: "Anh ơi em đã ghi nhận và chuyển trực tiếp cho quản lý shop xử lý trong 15 phút ạ. Em xin lỗi anh đã phải trải qua việc này 🙏"' }
    ],
    c4: [
      { from: 'customer', time: '08:50', text: 'Shop ơi' },
      { from: 'ai_thinking', text: 'AI nhận diện khách quen — load lịch sử...', context: [
        '✓ Lần cuối: 15/02 mua AirPods Pro 2',
        '✓ Đã hỏi: "Hộp sạc rời còn không?" (chưa chốt)',
        '✓ Hộp sạc rời đang giảm 15%'
      ]},
      { from: 'ai_draft', text: 'Dạ chị Hương ơi em chào chị ạ! 😊 Em vẫn nhớ lần trước chị có hỏi về hộp sạc rời cho AirPods Pro 2. Hiện shop đang có chương trình giảm 15% cho mặt hàng này (chỉ còn 850k thay vì 1tr), chị quan tâm em báo giá chi tiết nhé?', confidence: 91 }
    ]
  },

  // Insight reports (auto-generated from chat data)
  insights: [
    { icon: '📊', title: '847 tin nhắn xử lý tuần này', detail: '91% tự động, 6% chờ duyệt, 3% cần xử lý cá nhân', cta: null },
    { icon: '❓', title: 'Câu hỏi phổ biến nhất: "Hàng có auth không?" (134 lần)', detail: 'Đề xuất: Thêm video unbox + tem auth vào ảnh sản phẩm chính', cta: 'Xem chi tiết' },
    { icon: '🔋', title: '23 khách hỏi pin S24 Ultra', detail: 'Đề xuất: Quay video test pin 24h và đăng TikTok — dự kiến giảm 60% câu hỏi', cta: 'Tạo content brief' },
    { icon: '📦', title: '8 khách phàn nàn hộp móp khi nhận', detail: 'Đề xuất: Đổi sang thùng carton dày 5 lớp — chi phí +2k/đơn, giảm 80% complaint', cta: 'Xem báo giá' },
    { icon: '💰', title: '12 khách hỏi giá sỉ từ 5 máy trở lên', detail: 'Insight: Có nhu cầu bán sỉ rõ ràng — cân nhắc tạo bảng giá sỉ chính thức', cta: 'Tạo bảng giá B2B' }
  ],

  // AI Performance metrics
  ai_perf: {
    total_executed: 142,
    approval_rate: 76,
    revenue_added: 87500000,
    response_time_before: 480, // 8 phút
    response_time_after: 12 // 12 giây
  },

  ai_perf_by_agent: [
    { name: 'Pricing Agent', icon: '💰', total: 32, approved: 78, result: '+34M doanh thu', trend: 'up' },
    { name: 'Content Agent', icon: '📝', total: 18, approved: 89, result: '+12% CR trung bình', trend: 'up' },
    { name: 'Promotion Agent', icon: '🎁', total: 24, approved: 71, result: '+18M doanh thu', trend: 'up' },
    { name: 'Customer Service Agent', icon: '💬', total: 47, approved: 94, result: '4.85★ rating', trend: 'up' },
    { name: 'Ads Agent', icon: '📢', total: 21, approved: 67, result: 'ROAS 7.8x', trend: 'neutral' }
  ],

  // Settings - team members
  team_members: [
    { name: 'Hoàng Minh Đức', email: 'duc.hoang@phonemax.vn', role: 'Admin' },
    { name: 'Lê Thị Minh Ngọc', email: 'ngoc.le@phonemax.vn', role: 'Vận hành' },
    { name: 'Trần Văn A', email: 'a.tran@phonemax.vn', role: 'Chỉ xem' }
  ],

  recent_activity: [
    { time: '5 phút', user: 'AI Agent', action: 'Đề xuất giảm giá S24 Ultra 4%', status: 'pending' },
    { time: '23 phút', user: 'Hoàng Minh Đức', action: 'Duyệt: Tăng budget AirPods +30%', status: 'approved' },
    { time: '1 giờ', user: 'AI Agent', action: 'Phản hồi khách Trần Văn B (auto)', status: 'approved' },
    { time: '2 giờ', user: 'Lê Thị Minh Ngọc', action: 'Từ chối: Giảm giá Buds3 Pro', status: 'rejected' },
    { time: 'Hôm qua', user: 'AI Agent', action: 'Tạo báo cáo insight tuần', status: 'approved' }
  ]
};

/* =====================================================================
   1b. EXTENDED MOCK DATA — for feature pages
   ===================================================================== */

MOCK.content_inventory = [
  { id: 'cnt-001', type: 'blog', title: 'Hướng dẫn sạc AirPods Pro 2', topic: 'pin/sạc', published: '01/03/2026', views: 1240, questions_reduced: 31, product: 'AirPods Pro 2' },
  { id: 'cnt-002', type: 'video', title: 'Unbox iPhone 15 Pro Max chính hãng', topic: 'auth/hàng thật', published: '15/02/2026', views: 45200, questions_reduced: 45, product: 'iPhone 15 Pro Max' },
  { id: 'cnt-003', type: 'faq', title: 'FAQ: Bảo hành Samsung Galaxy', topic: 'bảo hành', published: '10/01/2026', views: 890, questions_reduced: 22, product: 'Galaxy S24 Ultra' }
];

MOCK.products_detail = [
  {
    sku: 'S24-ULTRA-TIM', name: 'Samsung Galaxy S24 Ultra', category: 'Smartphone', price: 29990000,
    description_current: 'Samsung Galaxy S24 Ultra 256GB — màn hình Dynamic AMOLED 6.8 inch. Chip Snapdragon 8 Gen 3. Bút S Pen tích hợp. Bộ nhớ 12GB RAM. Pin 5000mAh. Hàng chính hãng Samsung Việt Nam, bảo hành 12 tháng.',
    description_key_points: ['màn hình AMOLED', 'Snapdragon 8 Gen 3', 'S Pen', '5000mAh', 'bảo hành 12 tháng'],
    chatbot_questions: [
      { topic: 'Thời lượng pin', count: 23, sample: 'Pin dùng được mấy tiếng?', sentiment: 'neutral' },
      { topic: 'Tốc độ sạc', count: 14, sample: 'Sạc 45W thì đầy bao lâu?', sentiment: 'neutral' },
      { topic: 'Camera chất lượng', count: 18, sample: 'Zoom 100x có dùng được không?', sentiment: 'positive' },
      { topic: 'Hàng auth', count: 17, sample: 'Hàng có tem chính hãng không?', sentiment: 'neutral' },
      { topic: 'Giá sỉ', count: 12, sample: 'Lấy 3 cái có giảm không?', sentiment: 'neutral' },
      { topic: 'So sánh với iPhone', count: 9, sample: 'So với iPhone 15 Pro Max thì sao?', sentiment: 'neutral' }
    ],
    review_features: [
      { feature: 'Pin & Sạc', mentions: 31, positive: 8, negative: 23, sample_neg: 'Pin tụt nhanh khi dùng camera zoom' },
      { feature: 'S Pen', mentions: 14, positive: 14, negative: 0, sample_pos: 'Bút viết mượt, app Samsung Notes tuyệt' },
      { feature: 'Camera', mentions: 28, positive: 24, negative: 4, sample_pos: 'Chụp đêm cực đỉnh, zoom 100x rõ nét' },
      { feature: 'Hàng auth', mentions: 12, positive: 12, negative: 0, sample_pos: 'Seal nguyên vẹn, có tem chính hãng' },
      { feature: 'Giao hang', mentions: 8, positive: 5, negative: 3, sample_neg: 'Hộp bị móp nhẹ' }
    ]
  },
  {
    sku: 'ANKER-100W-CAP', name: 'Cáp Anker 100W USB-C', category: 'Phụ kiện sạc', price: 350000,
    description_current: 'Cáp Anker 100W USB-C to USB-C. Hỗ trợ sạc nhanh đến 100W. Dài 1.8m. Chất liệu dệt bền. Tương thích mọi thiết bị USB-C.',
    description_key_points: ['100W', '1.8m', 'chất liệu dệt', 'USB-C'],
    chatbot_questions: [
      { topic: 'Độ bền / Tuổi thọ', count: 15, sample: 'Cáp dùng được bao lâu?', sentiment: 'negative' },
      { topic: 'Tương thích thiết bị', count: 11, sample: 'Dùng được với MacBook Pro không?', sentiment: 'neutral' },
      { topic: 'Tốc độ sạc thực tế', count: 9, sample: 'Sạc thực tế được mấy W?', sentiment: 'neutral' },
      { topic: 'Đổi trả lỗi', count: 8, sample: 'Cáp bị hỏng shop đổi không?', sentiment: 'negative' }
    ],
    review_features: [
      { feature: 'Độ bền', mentions: 18, positive: 2, negative: 16, sample_neg: 'Dùng 1 tuần sạc chậm lại, 2 tuần là hư' },
      { feature: 'Tốc độ sạc', mentions: 12, positive: 7, negative: 5, sample_pos: 'Sạc nhanh lúc mới mua' },
      { feature: 'Thiết kế', mentions: 6, positive: 6, negative: 0, sample_pos: 'Nhìn chắc chắn, dây bọc dệt đẹp' },
      { feature: 'Bảo hành', mentions: 8, positive: 0, negative: 8, sample_neg: 'Shop xử lý bảo hành chậm' }
    ]
  },
  {
    sku: 'AIRPODS-PRO2', name: 'Apple AirPods Pro 2 (USB-C)', category: 'Tai nghe', price: 5200000,
    description_current: 'Apple AirPods Pro 2 cổng USB-C. Chip H2 mới nhất. Chống ồn ANC cải tiến. Pin 6h + 30h với case. Kháng nước IPX4. Hàng chính hãng VNA.',
    description_key_points: ['chip H2', 'ANC', 'pin 6h', 'IPX4', 'chính hãng VNA'],
    chatbot_questions: [
      { topic: 'Thời lượng pin', count: 23, sample: 'Pin nghe được mấy tiếng?', sentiment: 'neutral' },
      { topic: 'Chống ồn ANC', count: 16, sample: 'ANC có tốt không? Dùng ở văn phòng ồn ok không?', sentiment: 'neutral' },
      { topic: 'Kết nối thiết bị khác', count: 12, sample: 'Dùng với Samsung được không?', sentiment: 'neutral' },
      { topic: 'Giá vs hàng grey', count: 8, sample: 'Giá shop tại sao cao hơn chỗ khác?', sentiment: 'negative' },
      { topic: 'Bảo hành', count: 7, sample: 'Bảo hành ở đâu? Bao lâu?', sentiment: 'neutral' }
    ],
    review_features: [
      { feature: 'Chống ồn ANC', mentions: 24, positive: 22, negative: 2, sample_pos: 'ANC tuyệt vời, đi làm không nghe gì xung quanh' },
      { feature: 'Pin', mentions: 19, positive: 11, negative: 8, sample_neg: 'Pin 6h hơi ít, phải sạc giữa ca' },
      { feature: 'Âm thanh', mentions: 18, positive: 17, negative: 1, sample_pos: 'Nghe nhạc rất hay, bass tốt' },
      { feature: 'Kết nối Samsung', mentions: 6, positive: 1, negative: 5, sample_neg: 'Mua về dùng Samsung, kết nối chập chờn' },
      { feature: 'Thiết kế / Fit', mentions: 9, positive: 9, negative: 0, sample_pos: 'Đeo vừa, không đau tai dù đeo lâu' }
    ]
  }
];

MOCK.content_suggestions_generated = [
  {
    id: 'cs-001', priority: 'high', status: 'pending', type: 'video',
    title: 'Video test pin S24 Ultra — "72 giờ sử dụng thực tế"',
    platform: 'TikTok + YouTube',
    chatbot_signal: { count: 23, topic: 'Hỏi thời lượng pin S24 Ultra', sample_questions: ['Pin dùng được mấy tiếng?', 'Pin chơi game thì hao nhanh không?', 'Sạc 1 lần dùng cả ngày không?'] },
    review_signal: { count: 23, neg_pct: 74, sample_reviews: ['Pin tụt nhanh khi dùng camera zoom', 'Pin không được như quảng cáo'] },
    combined_score: 94,
    estimated_impact: 'Giảm ~60% câu hỏi về pin, tăng CR 8-12%',
    estimated_production: '1 ngày quay + editing',
    angle: 'Test thực tế: sạc đầy lúc 8h sáng, dùng hết ngày làm việc, chụp 200 ảnh, xem 2h video, còn bao nhiêu %?'
  },
  {
    id: 'cs-002', priority: 'high', status: 'pending', type: 'blog_faq',
    title: '"AirPods Pro 2 có dùng được với Android không?" — FAQ + Video test',
    platform: 'Blog + TikTok',
    chatbot_signal: { count: 12, topic: 'Hỏi kết nối với Samsung/Android', sample_questions: ['Dùng với Samsung được không?', 'ANC dùng được trên Android không?', 'Kết nối Samsung thì nghe có tốt không?'] },
    review_signal: { count: 6, neg_pct: 83, sample_reviews: ['Mua về dùng Samsung, kết nối chập chờn', 'ANC không hoạt động trên Android'] },
    combined_score: 87,
    estimated_impact: 'Giảm 40% câu hỏi về Android, giúp set expectations đúng',
    estimated_production: '2-3 giờ viết + test',
    angle: 'Trả lời thẳng: AirPods Pro 2 HOẠT ĐỘNG với Android nhưng bị giới hạn tính năng nào, nếu bạn xài Android thì nên cân nhắc...'
  },
  {
    id: 'cs-003', priority: 'high', status: 'pending', type: 'comparison',
    title: 'So sanh Galaxy S24 Ultra vs iPhone 15 Pro Max — "Tiêu 30 triệu nên chọn máy nào?"',
    platform: 'Blog + YouTube',
    chatbot_signal: { count: 9, topic: 'So sanh S24 Ultra voi iPhone 15 PM', sample_questions: ['S24 Ultra hay iPhone 15 PM tốt hơn?', 'Chụp ảnh thì máy nào ngon hơn?', 'Bền hơn thì máy nào?'] },
    review_signal: { count: 4, neg_pct: 10, sample_reviews: ['Đang phân vân mua cái nào', 'Bảo hành S24 tốt hơn iPhone'] },
    combined_score: 76,
    estimated_impact: 'Hỗ trợ quyết định mua hàng, giảm 30% thời gian tư vấn chatbot',
    estimated_production: '1 ngày nghiên cứu + viết',
    angle: 'Phân tích theo use case: công việc vs gaming vs nhiều ảnh vs video. Không có máy tốt hơn tuyệt đối, chỉ có phù hợp hơn'
  },
  {
    id: 'cs-004', priority: 'medium', status: 'pending', type: 'guide',
    title: '"Bảng giá sỉ chính thức" — Landing page cho khách B2B',
    platform: 'Website + Shopee',
    chatbot_signal: { count: 12, topic: 'Hỏi giá sỉ từ 5 máy trở lên', sample_questions: ['Lấy 5 cái có giảm không?', 'Bảng giá sỉ của shop?', 'Mua 10 máy được bao nhiêu %?'] },
    review_signal: { count: 0, neg_pct: 0, sample_reviews: [] },
    combined_score: 65,
    estimated_impact: 'Mở kênh B2B mới, dự kiến +5-8 đơn sỉ/tháng',
    estimated_production: '3-4 giờ thiết kế page',
    angle: 'Tạo landing page riêng với bảng giá sỉ rõ ràng, form đặt hàng sỉ, hotline riêng cho đại lý'
  },
  {
    id: 'cs-005', priority: 'medium', status: 'saved', type: 'video',
    title: '"Kiểm tra hàng auth" — Video quy trình unbox + tem chính hãng',
    platform: 'TikTok + Shopee video',
    chatbot_signal: { count: 17, topic: 'Hỏi hàng auth, tem chính hãng', sample_questions: ['Hàng có auth không?', 'Tem chính hãng Samsung có không?', 'Mua ở đây có bị hàng giả không?'] },
    review_signal: { count: 12, neg_pct: 5, sample_reviews: ['Seal nguyên vẹn, có tem chính hãng', 'Hàng auth 100%, mua an tâm'] },
    combined_score: 71,
    estimated_impact: 'Giảm 45% câu hỏi về hàng auth, tăng trust score',
    estimated_production: '2-3 giờ quay',
    angle: 'Video thực chiến: mở hộp live, kiểm tra tem, verify IMEI online ngay trên camera'
  }
];

MOCK.market_trends = [
  {
    topic: 'Pin & Sạc nhanh',
    chatbot_count: 37, review_count: 31, total_signals: 68,
    sentiment_pct: { positive: 10, neutral: 28, negative: 62 },
    trend_direction: 'up', trend_pct: 18,
    competitor_note: 'CellphoneS đăng video "test sạc 67W" đạt 120k views',
    opportunity: 'Tạo content test pin thực tế — xóa bỏ lo ngại của 62% khách hỏi tiêu cực'
  },
  {
    topic: 'Hàng auth & Tem chính hãng',
    chatbot_count: 17, review_count: 12, total_signals: 29,
    sentiment_pct: { positive: 75, neutral: 20, negative: 5 },
    trend_direction: 'stable', trend_pct: 3,
    competitor_note: null,
    opportunity: 'Đây là điểm MẠNH — amplify bằng video unbox để tăng trust'
  },
  {
    topic: 'Độ bền / Chất lượng dài hạn',
    chatbot_count: 24, review_count: 26, total_signals: 50,
    sentiment_pct: { positive: 25, neutral: 30, negative: 45 },
    trend_direction: 'up', trend_pct: 31,
    competitor_note: 'Cáp Anker lô T03 đang viral tiêu cực — rủi ro lan sang thương hiệu shop',
    opportunity: 'Cần video "test độ bền thực tế" + chính sách bảo hành rõ ràng hơn'
  },
  {
    topic: 'Giá sỉ & Đặt số lượng lớn',
    chatbot_count: 12, review_count: 0, total_signals: 12,
    sentiment_pct: { positive: 0, neutral: 100, negative: 0 },
    trend_direction: 'up', trend_pct: 45,
    competitor_note: 'Hoàng Hà đã có bảng giá sỉ công khai trên website',
    opportunity: 'Cơ hội B2B: 12 khách hỏi sỉ chưa có kênh chính thức để phục vụ'
  },
  {
    topic: 'So sánh sản phẩm',
    chatbot_count: 9, review_count: 4, total_signals: 13,
    sentiment_pct: { positive: 20, neutral: 70, negative: 10 },
    trend_direction: 'stable', trend_pct: 5,
    competitor_note: null,
    opportunity: 'Content comparison giúp khách tự ra quyết định, giảm tải chatbot'
  }
];

MOCK.competitor_gaps = [
  { feature: 'Video test pin 24h+', competitor: 'CellphoneS', impact: 'Khách tham khảo competitor trước khi mua', chatbot_count: 23, gap_type: 'content' },
  { feature: 'Bảng giá sỉ công khai', competitor: 'Hoang Ha + MobileWorld', impact: '12 khách hỏi sỉ nhưng không chốt vì không có bảng giá', chatbot_count: 12, gap_type: 'business' },
  { feature: 'Chính sách bảo hành rõ ràng', competitor: 'CellphoneS', impact: 'Khách không tin tưởng về bảo hành dài hạn', chatbot_count: 8, gap_type: 'policy' },
  { feature: 'Live stream unbox', competitor: 'TechZone', impact: 'Tăng trust hàng auth — đang trending', chatbot_count: 17, gap_type: 'content' }
];

let currentProductDescSku = 'S24-ULTRA-TIM';


/* =====================================================================
   2. HELPERS
   ===================================================================== */
const fmt = {
  currency: (v) => {
    if (v >= 1e9) return (v/1e9).toFixed(1).replace('.0','') + 'B';
    if (v >= 1e6) return (v/1e6).toFixed(1).replace('.0','') + 'M';
    if (v >= 1e3) return (v/1e3).toFixed(0) + 'K';
    return v.toString();
  },
  vnd: (v) => v.toLocaleString('vi-VN') + 'đ',
  percent: (v, sign=true) => (sign && v > 0 ? '+' : '') + v + '%'
};

const ICON = {
  arrowUp: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>',
  arrowDown: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
  warning: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  brain: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M13 2L3 14h7v8l10-12h-7z"/></svg>'
};

function sparkline(data, color='#eab308') {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  return '<div class="sparkline">' + data.map(v => {
    const h = Math.max(4, Math.round(((v - min) / range) * 32) + 8);
    return '<div class="sparkline-bar" style="height:' + h + 'px;background:' + color + ';opacity:' + (0.5 + h/80).toFixed(2) + ';"></div>';
  }).join('') + '</div>';
}

function trendBadge(v) {
  const up = v >= 0;
  const color = up ? 'var(--accent-emerald)' : 'var(--accent-rose)';
  const bg = up ? 'var(--accent-emerald-bg)' : 'var(--accent-rose-bg)';
  return `<span class="stat-card-trend" style="color:${color};background:${bg};">${up ? ICON.arrowUp : ICON.arrowDown} ${Math.abs(v)}% vs kỳ trước</span>`;
}

function confBar(pct) {
  return `<div class="conf-progress"><div class="conf-fill" style="width:${pct}%"></div></div>`;
}

/* =====================================================================
   3. TOAST / MODAL / SLIDEOVER / SCAN
   ===================================================================== */
function showToast(msg, type='success') {
  const c = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  const icons = { success: '✅', warning: '⚠️', info: 'ℹ️', danger: '🚫' };
  el.innerHTML = `<span class="toast-icon">${icons[type] || '✅'}</span><span class="toast-message">${msg}</span>`;
  c.appendChild(el);
  setTimeout(() => { el.classList.add('removing'); setTimeout(()=>el.remove(), 300); }, 3500);
}

let pendingFeedbackId = null;
function openFeedbackModal(sugId) {
  pendingFeedbackId = sugId;
  document.getElementById('feedbackText').value = '';
  document.getElementById('modalSubmitBtn').disabled = true;
  document.getElementById('feedbackModal').classList.add('show');
}
function closeFeedbackModal() {
  document.getElementById('feedbackModal').classList.remove('show');
  pendingFeedbackId = null;
}

function openSlideover(sug) {
  // Build slideover dynamically
  let panel = document.getElementById('slideoverPanel');
  if (!panel) {
    const html = `
      <div class="slideover-backdrop" id="slideoverBackdrop"></div>
      <aside class="slideover-panel" id="slideoverPanel">
        <div class="slideover-header">
          <h3 id="slideoverTitle"></h3>
          <button class="modal-close-btn" id="slideoverClose">✕</button>
        </div>
        <div class="slideover-body" id="slideoverBody"></div>
      </aside>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('slideoverClose').onclick = closeSlideover;
    document.getElementById('slideoverBackdrop').onclick = closeSlideover;
    panel = document.getElementById('slideoverPanel');
  }
  document.getElementById('slideoverTitle').textContent = sug.title;
  document.getElementById('slideoverBody').innerHTML = `
    <div class="slideover-section">
      <div class="section-title" style="margin-bottom:8px;">${ICON.brain} Lý do AI đề xuất</div>
      <p style="color:var(--text-secondary); font-size:0.9rem;">${sug.reason}</p>
    </div>
    <div class="slideover-section">
      <div class="section-title" style="margin-bottom:8px;">📊 Số liệu dự kiến</div>
      <div class="sug-metrics">
        ${sug.metrics.map(m => `<div class="sug-metric"><div class="sug-metric-label">${m.label}</div><div class="sug-metric-value">${m.value}</div></div>`).join('')}
      </div>
    </div>
    <div class="slideover-section">
      <div class="section-title" style="margin-bottom:8px;">🎯 Độ tin cậy AI</div>
      <div class="confidence-row">
        <span class="confidence-label">Confidence Score</span>
        <span class="confidence-value">${sug.confidence}%</span>
      </div>
      ${confBar(sug.confidence)}
    </div>
    <div class="slideover-section">
      <div class="section-title" style="margin-bottom:8px;">⚙️ Logic suy luận</div>
      <ul style="font-size:0.85rem; color:var(--text-secondary); padding-left:18px; line-height:1.8;">
        <li>Quan sát: Crawl giá đối thủ (Market Agent)</li>
        <li>Phân tích: Đánh giá biên lợi nhuận, tồn kho (Pricing Agent)</li>
        <li>Đối chiếu: Lịch sử mua hàng + LTV khách (Customer DB)</li>
        <li>Quyết định: Tính toán optimal price giữ margin ≥ ${MOCK.shop.margin_floor}%</li>
        <li>Học hỏi: Lưu vào ChromaDB → cải thiện đề xuất tương lai</li>
      </ul>
    </div>
    <div class="slideover-section">
      <div class="section-title" style="margin-bottom:8px;">📜 Đề xuất tương tự trước đó</div>
      <div class="slideover-history-item">
        <div style="font-size:0.85rem; font-weight:600;">Giảm giá iPhone 15 Pro Max 3% (12/3)</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">Kết quả: +14M doanh thu, margin giữ 12%</div>
      </div>
      <div class="slideover-history-item">
        <div style="font-size:0.85rem; font-weight:600;">Giảm giá Galaxy S23 5% (28/2)</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">Kết quả: +9M doanh thu, margin giữ 9%</div>
      </div>
    </div>
  `;
  panel.classList.add('show');
  document.getElementById('slideoverBackdrop').classList.add('show');
}
function closeSlideover() {
  const p = document.getElementById('slideoverPanel');
  const b = document.getElementById('slideoverBackdrop');
  if (p) p.classList.remove('show');
  if (b) b.classList.remove('show');
}

function runScan() {
  const overlay = document.getElementById('scanOverlay');
  const btn = document.getElementById('btnScan');
  overlay.classList.add('show');
  btn.classList.add('scanning');
  setTimeout(() => {
    overlay.classList.remove('show');
    btn.classList.remove('scanning');
    showToast('Quét hoàn tất! AI đã phát hiện 3 cơ hội mới — xem trang Đề xuất AI', 'success');
  }, 2800);
}

/* =====================================================================
   4. PAGE RENDERERS
   ===================================================================== */


// ===== Crisis Banner Helper (string concat, avoids nested template literal issues) =====
function renderCrisisBannerHTML() {
  const active = MOCK.crises.filter(c => c.status === 'active');
  if (!active.length) return '';
  return active.map(cr => {
    const signals = cr.signals.map(s =>
      '<span style="font-size:0.75rem;color:#fca5a5;">' + s.icon + ' <b style="color:#fecaca;">' + s.agent + ':</b> ' + s.title + '</span>'
    ).join('');
    return '<div style="display:flex;align-items:center;gap:14px;padding:10px 16px;margin-bottom:16px;'
      + 'background:linear-gradient(90deg,#7f1d1d,#991b1b);border-radius:12px;border:1px solid #ef4444;'
      + 'box-shadow:0 0 20px rgba(239,68,68,0.25);">'
      + '<div style="font-size:1.4rem;flex-shrink:0;">🚨</div>'
      + '<div style="flex:1;min-width:0;">'
      +   '<div style="color:#fca5a5;font-size:0.65rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Orchestrator · MỨC ĐỎ · ' + cr.detected_at + '</div>'
      +   '<div style="color:#fff;font-weight:800;font-size:0.92rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'
      +     cr.product + ' — ' + cr.affected_customers + ' khách · Severity <span style="color:#f87171;">' + cr.severity_score + '/100</span>'
      +     ' · Rủi ro <span style="color:#f87171;">' + fmt.currency(cr.revenue_at_risk) + 'đ</span>'
      +   '</div>'
      +   '<div style="display:flex;gap:12px;margin-top:4px;flex-wrap:wrap;">' + signals + '</div>'
      + '</div>'
      + '<button class="btn-crisis-view" data-crisis="' + cr.id + '" '
      +   'style="flex-shrink:0;background:#ef4444;color:white;border:none;padding:8px 16px;'
      +   'border-radius:8px;font-weight:700;cursor:pointer;font-size:0.8rem;white-space:nowrap;">'
      +   '🔥 Xử lý →'
      + '</button>'
      + '</div>';
  }).join('');
}

// ===== Dashboard =====
function renderDashboard() {
  const k = MOCK.kpis;
  const ai = MOCK.ai_today;
  return `

    ${renderCrisisBannerHTML()}
    <!-- Filter Tabs -->    <!-- Filter Tabs -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;flex-wrap:wrap;gap:12px;">
      <div class="filter-tabs">
        <button class="filter-tab active">Tất cả sàn</button>
        <button class="filter-tab">Shopee</button>
        <button class="filter-tab">Tiki</button>
        <button class="filter-tab">Website</button>
      </div>
      <div class="filter-tabs">
        <button class="filter-tab">Hôm nay</button>
        <button class="filter-tab active">7 Ngày qua</button>
        <button class="filter-tab">30 Ngày qua</button>
      </div>
    </div>

    <!-- KPI Cards with Sparklines -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-header">
          <div>
            <div class="stat-card-label">Doanh thu</div>
            <div class="stat-card-value">${fmt.currency(k.revenue.value)}đ</div>
          </div>
          <div class="stat-card-icon" style="background:var(--accent-amber-bg);color:var(--accent-amber);">💰</div>
        </div>
        ${sparkline(k.revenue.sparkline)}
        ${trendBadge(k.revenue.trend)}
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <div>
            <div class="stat-card-label">Tổng Đơn Hàng</div>
            <div class="stat-card-value">${k.orders.value}</div>
          </div>
          <div class="stat-card-icon" style="background:var(--accent-emerald-bg);color:var(--accent-emerald);">📦</div>
        </div>
        ${sparkline(k.orders.sparkline, '#10b981')}
        ${trendBadge(k.orders.trend)}
      </div>

      <div class="stat-card" style="${k.cr.warning ? 'border-color:var(--accent-rose);' : ''}">
        <div class="stat-card-header">
          <div>
            <div class="stat-card-label">Tỷ Lệ Chuyển Đổi (CR) ${k.cr.warning ? `<span style="color:var(--accent-rose);">${ICON.warning}</span>` : ''}</div>
            <div class="stat-card-value">${k.cr.value}%</div>
          </div>
          <div class="stat-card-icon" style="background:var(--accent-rose-bg);color:var(--accent-rose);">🎯</div>
        </div>
        ${sparkline(k.cr.sparkline, '#f43f5e')}
        ${trendBadge(k.cr.trend)}
        ${k.cr.warning ? '<div style="margin-top:8px;font-size:0.75rem;color:var(--accent-rose);font-style:italic;">⚠ AI đang phân tích nguyên nhân</div>' : ''}
      </div>

      <div class="stat-card">
        <div class="stat-card-header">
          <div>
            <div class="stat-card-label">AOV (Giỏ hàng)</div>
            <div class="stat-card-value">${fmt.currency(k.aov.value)}đ</div>
          </div>
          <div class="stat-card-icon" style="background:var(--accent-indigo-bg);color:var(--accent-indigo);">🛒</div>
        </div>
        ${sparkline(k.aov.sparkline)}
        ${trendBadge(k.aov.trend)}
      </div>
    </div>

    <!-- 🚨 Cảnh báo & Hành động ngay -->
    <div class="content-card" style="margin-top:20px;">
      <div class="content-card-title">🚨 Cảnh báo & Hành động ngay (${MOCK.alerts.length})</div>
      <div class="alert-list">
        ${MOCK.alerts.map(a => `
          <div class="alert-item">
            <div class="alert-icon">${a.icon}</div>
            <div class="alert-content"><div class="alert-text">${a.text}</div></div>
            <button class="alert-cta" data-nav="${a.cta_page}">${a.cta} →</button>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Hiệu suất AI Agent hôm nay -->
    <div class="content-card" style="margin-top:20px;">
      <div class="content-card-title">${ICON.brain} Hiệu suất AI Agent hôm nay</div>
      <div class="grid-3" style="gap:12px;">
        <div class="big-metric">
          <div class="big-metric-value" style="color:var(--accent-amber);">${ai.suggestions_created}</div>
          <div class="big-metric-label">Đề xuất AI tạo ra</div>
          <div class="big-metric-trend">✅ ${ai.suggestions_approved} duyệt · ⏳ ${ai.suggestions_pending} chờ · ❌ ${ai.suggestions_rejected} từ chối</div>
        </div>
        <div class="big-metric">
          <div class="big-metric-value" style="color:var(--accent-emerald);">${ai.chats_handled}</div>
          <div class="big-metric-label">Tin nhắn xử lý</div>
          <div class="big-metric-trend">${Math.round(ai.chats_auto/ai.chats_handled*100)}% tự động · ${ai.chats_escalated} cần chủ shop</div>
        </div>
        <div class="big-metric">
          <div class="big-metric-value" style="color:var(--accent-blue);">${fmt.currency(ai.revenue_from_ai)}đ</div>
          <div class="big-metric-label">Doanh thu từ đề xuất AI</div>
          <div class="big-metric-trend">+ROAS trung bình 8.4x</div>
        </div>
      </div>
    </div>

    <!-- Donut + Doanh thu vs Mục tiêu -->
    <div class="grid-2" style="margin-top:20px;">
      <div class="content-card">
        <div class="content-card-title">Cơ Cấu Doanh Thu</div>
        <div class="donut-chart">
          <svg viewBox="0 0 36 36" width="180" height="180">
            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#e5e7eb" stroke-width="3.5"/>
            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" stroke-width="3.5" stroke-dasharray="65 35" stroke-dashoffset="0"/>
            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#0ea5e9" stroke-width="3.5" stroke-dasharray="20 80" stroke-dashoffset="-65"/>
            <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" stroke-width="3.5" stroke-dasharray="15 85" stroke-dashoffset="-85"/>
          </svg>
          <div class="donut-center">
            <div class="donut-center-value">3</div>
            <div class="donut-center-label">Nền tảng</div>
          </div>
        </div>
        <div class="donut-legend">
          ${MOCK.platforms.filter(p=>p.connected).map(p => `
            <div class="donut-legend-item">
              <span class="legend-dot" style="background:${p.color};"></span>
              <span>${p.name}</span><strong>${p.share}%</strong>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="content-card">
        <div class="content-card-title">Doanh Thu vs Mục Tiêu (Tháng này)</div>
        <div class="h-bars">
          ${MOCK.platforms.filter(p=>p.connected).map(p => `
            <div class="h-bar-item">
              <div class="h-bar-label">${p.name}</div>
              <div class="h-bar-track"><div class="h-bar-fill" style="width:${p.target_pct}%; background:${p.color};"></div></div>
              <div class="h-bar-value">${p.target_pct}%</div>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:16px; padding:12px; background:var(--bg-glass); border-radius:var(--radius-sm); font-size:0.8rem; color:var(--text-secondary);">
          📈 <strong>AI dự báo cuối tháng:</strong> Đạt 3.05B / 3.2B mục tiêu (95%) — cần đẩy thêm 150M trong 12 ngày còn lại
        </div>
      </div>
    </div>
  `;
}

// ===== AI Suggestions Page =====
let currentSugTab = 'pending';
let currentSugType = 'all';

function renderAISuggestions() {
  return `
    <div class="ai-sug-tabs">
      <button class="ai-sug-tab ${currentSugTab==='all'?'active':''}" data-tab="all">Tất cả <span class="ai-sug-tab-count">${MOCK.suggestions.length}</span></button>
      <button class="ai-sug-tab ${currentSugTab==='pending'?'active':''}" data-tab="pending">⏳ Chờ duyệt <span class="ai-sug-tab-count" style="background:var(--accent-amber-bg);color:var(--accent-amber);">${MOCK.suggestions.filter(s=>s.status==='pending').length}</span></button>
      <button class="ai-sug-tab ${currentSugTab==='approved'?'active':''}" data-tab="approved">✅ Đã duyệt <span class="ai-sug-tab-count" style="background:var(--accent-emerald-bg);color:var(--accent-emerald);">${MOCK.suggestions.filter(s=>s.status==='approved').length}</span></button>
      <button class="ai-sug-tab ${currentSugTab==='rejected'?'active':''}" data-tab="rejected">❌ Đã từ chối <span class="ai-sug-tab-count" style="background:var(--accent-rose-bg);color:var(--accent-rose);">${MOCK.suggestions.filter(s=>s.status==='rejected').length}</span></button>
    </div>

    <div class="ai-sug-sub-filters">
      <span style="font-size:0.8rem;color:var(--text-muted);font-weight:600;">Loại:</span>
      <button class="ai-sug-tab small ${currentSugType==='all'?'active':''}" data-type="all">Tất cả</button>
      <button class="ai-sug-tab small ${currentSugType==='price'?'active':''}" data-type="price">💰 Giá</button>
      <button class="ai-sug-tab small ${currentSugType==='content'?'active':''}" data-type="content">📝 Nội dung</button>
      <button class="ai-sug-tab small ${currentSugType==='promo'?'active':''}" data-type="promo">🎁 Khuyến mãi</button>
      <button class="ai-sug-tab small ${currentSugType==='cs'?'active':''}" data-type="cs">💬 CSKH</button>
      <button class="ai-sug-tab small ${currentSugType==='ads'?'active':''}" data-type="ads">📢 Quảng cáo</button>
    </div>

    <div class="ai-sug-list">
      ${MOCK.suggestions.filter(s => {
        if (currentSugTab !== 'all' && s.status !== currentSugTab) return false;
        if (currentSugType !== 'all' && s.type !== currentSugType) return false;
        return true;
      }).map(s => renderSugCard(s)).join('') || `<div style="padding:40px;text-align:center;color:var(--text-muted);">Không có đề xuất nào trong mục này.</div>`}
    </div>
  `;
}

function renderSugCard(s) {
  const typeMeta = {
    price: { label: 'Giá', color: '#eab308' },
    content: { label: 'Nội dung', color: '#0ea5e9' },
    promo: { label: 'Khuyến mãi', color: '#f43f5e' },
    cs: { label: 'CSKH', color: '#10b981' },
    ads: { label: 'Quảng cáo', color: '#f59e0b' }
  }[s.type];

  return `
    <div class="sug-card" data-id="${s.id}">
      <div class="sug-card-header">
        <span class="sug-type-badge" style="background:${typeMeta.color}22; color:${typeMeta.color};">${typeMeta.label}</span>
        <span class="sug-time">${s.time}</span>
        ${s.status !== 'pending' ? `<span class="sug-status" style="color:${s.status==='approved'?'var(--accent-emerald)':'var(--accent-rose)'};margin-left:auto;">${s.status==='approved'?'✅ Đã duyệt':'❌ Đã từ chối'}</span>` : ''}
      </div>
      <div class="sug-title">${s.title}</div>
      <div class="sug-reason">${s.reason}</div>
      <div class="sug-metrics">
        ${s.metrics.map(m => `<div class="sug-metric"><div class="sug-metric-label">${m.label}</div><div class="sug-metric-value">${m.value}</div></div>`).join('')}
      </div>
      <div class="confidence-row" style="margin:12px 0 4px;">
        <span class="confidence-label">Độ tin cậy AI</span>
        <span class="confidence-value">${s.confidence}%</span>
      </div>
      ${confBar(s.confidence)}
      ${s.rejection_reason ? `<div style="margin-top:10px;padding:10px;background:var(--accent-rose-bg);border-radius:var(--radius-sm);font-size:0.8rem;color:var(--accent-rose);"><strong>Lý do từ chối:</strong> ${s.rejection_reason}</div>` : ''}
      ${s.status === 'pending' ? `
        <div class="sug-actions" style="margin-top:14px;">
          <button class="btn-sug-detail" data-action="detail" data-id="${s.id}">Xem chi tiết</button>
          <button class="btn-sug-approve" data-action="approve" data-id="${s.id}">✅ Duyệt</button>
          <button class="btn-sug-deny" data-action="deny" data-id="${s.id}">❌ Từ chối</button>
        </div>
      ` : ''}
    </div>
  `;
}

// ===== Revenue Page =====
function renderRevenue() {
  const max = Math.max(...MOCK.revenue_7d.map(d => d.shopee + d.tiki + d.website));
  return `
    <div class="grid-2">
      <div class="content-card">
        <div class="content-card-title">Doanh Thu 7 Ngày Qua (theo sàn)</div>
        <div class="bar-chart" style="display:flex;gap:12px;align-items:flex-end;height:240px;padding:20px 8px 8px;">
          ${MOCK.revenue_7d.map(d => {
            const total = d.shopee + d.tiki + d.website;
            const totalH = (total/max)*100;
            const sH = (d.shopee/total)*totalH;
            const tH = (d.tiki/total)*totalH;
            const wH = (d.website/total)*totalH;
            return `
              <div class="bar-col" style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end;">
                <div class="bar-value" style="font-size:0.7rem;color:var(--text-muted);margin-bottom:4px;font-weight:700;">${total}M</div>
                <div style="width:100%;height:${totalH}%;display:flex;flex-direction:column;border-radius:6px 6px 0 0;overflow:hidden;">
                  <div style="background:#10b981;height:${(d.shopee/total)*100}%;" title="Shopee: ${d.shopee}M"></div>
                  <div style="background:#f59e0b;height:${(d.tiki/total)*100}%;" title="Tiki: ${d.tiki}M"></div>
                  <div style="background:#0ea5e9;height:${(d.website/total)*100}%;" title="Website: ${d.website}M"></div>
                </div>
                <div class="bar-label" style="font-size:0.75rem;color:var(--text-muted);margin-top:6px;">${d.day}</div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="display:flex;gap:16px;justify-content:center;margin-top:12px;font-size:0.75rem;">
          <span><span class="legend-dot" style="background:#10b981;"></span> Shopee</span>
          <span><span class="legend-dot" style="background:#f59e0b;"></span> Tiki</span>
          <span><span class="legend-dot" style="background:#0ea5e9;"></span> Website</span>
        </div>
      </div>

      <div class="content-card">
        <div class="content-card-title">Báo Cáo Lợi Nhuận (P&L)</div>
        <table class="data-table" style="width:100%;font-size:0.85rem;">
          <thead><tr><th style="text-align:left;">Hạng mục</th><th style="text-align:right;">Giá trị</th><th style="text-align:right;">Trend</th></tr></thead>
          <tbody>
            ${MOCK.pnl.map(p => {
              const trendColor = p.trend==='up'?'var(--accent-emerald)':p.trend==='down'?'var(--accent-rose)':'var(--text-muted)';
              const trendLabel = p.trend==='up'?`↑${p.change}%`:p.trend==='down'?`~${p.change}%`:p.change>0?`~${p.change}%`:'-';
              return `<tr ${p.highlight?'style="background:var(--accent-emerald-bg);font-weight:700;"':p.italic?'style="font-style:italic;color:var(--text-muted);"':''}>
                <td>${p.label}${p.margin?` <span style="color:var(--accent-emerald);font-size:0.75rem;">(Margin ${p.margin}%)</span>`:''}</td>
                <td style="text-align:right;">${fmt.vnd(p.value)}</td>
                <td style="text-align:right;color:${trendColor};">${trendLabel}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="content-card" style="margin-top:20px;">
      <div class="content-card-title">Biên Lợi Nhuận Gộp Theo Sản Phẩm</div>
      <div class="h-bars">
        ${MOCK.margin_by_product.map(p => `
          <div class="h-bar-item">
            <div class="h-bar-label">${p.name}</div>
            <div class="h-bar-track"><div class="h-bar-fill" style="width:${p.margin}%;background:${p.color};"></div></div>
            <div class="h-bar-value">${p.margin}%</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ===== Inventory Page =====
function renderInventory() {
  const k = MOCK.inventory_kpis;
  return `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-card-label">Tổng Kho</div><div class="stat-card-value">${k.total.toLocaleString()}</div></div>
      <div class="stat-card"><div class="stat-card-label">Giá Trị Kho</div><div class="stat-card-value">${fmt.currency(k.value)}đ</div></div>
      <div class="stat-card" style="border-color:var(--accent-amber);"><div class="stat-card-label">Sắp Hết Cần Nhập</div><div class="stat-card-value" style="color:var(--accent-amber);">${k.low_stock} SKU</div></div>
      <div class="stat-card" style="border-color:var(--accent-rose);"><div class="stat-card-label">Tồn Lâu (Khó bán)</div><div class="stat-card-value" style="color:var(--accent-rose);">${k.slow_moving} SKU</div></div>
    </div>

    <div style="margin-top:16px;background:var(--bg-glass);padding:12px 16px;border-radius:var(--radius-sm);font-size:0.85rem;">
      📊 <strong>Vòng quay tồn kho trung bình:</strong> ${k.turnover_days} ngày &nbsp;·&nbsp; <strong>ABC Analysis:</strong> 23 SKU loại A (78% doanh thu), 89 SKU loại B, 122 SKU loại C
    </div>

    <div class="grid-2" style="margin-top:20px;">
      <div class="content-card">
        <div class="content-card-title">⚠️ Cảnh Báo Sắp Hết Hàng</div>
        <table class="data-table" style="width:100%;font-size:0.85rem;">
          <thead><tr><th>Sản phẩm</th><th>SL</th><th>Turnover</th></tr></thead>
          <tbody>
            ${MOCK.inventory_low.map(i => `
              <tr><td>${i.sku}</td><td style="color:var(--accent-rose);font-weight:700;">${i.qty}</td><td style="color:${i.days<=4?'var(--accent-rose)':'var(--accent-amber)'};">${i.days} ngày</td></tr>
            `).join('')}
          </tbody>
        </table>
        <button class="btn-approve" style="margin-top:12px;width:100%;" id="btnRestock">🤖 AI Soạn Yêu Cầu Nhập Hàng</button>
      </div>

      <div class="content-card">
        <div class="content-card-title">📦 Cảnh Báo Tồn Lâu (Cần Đẩy)</div>
        ${MOCK.inventory_slow.map(i => `
          <div style="padding:12px;border:1px solid var(--border-primary);border-radius:var(--radius-sm);margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong>${i.sku}</strong>
              <span style="color:var(--accent-rose);font-weight:700;">${i.days} ngày</span>
            </div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">Tồn: ${i.qty} cái</div>
            <div style="margin-top:8px;padding:8px;background:var(--accent-amber-bg);border-radius:4px;font-size:0.8rem;">
              <strong>${ICON.brain} AI lý giải:</strong> ${i.ai_reason}<br>
              <strong>Đề xuất:</strong> ${i.ai_action}
            </div>
          </div>
        `).join('')}
        <button class="btn-approve" style="width:100%;">🛒 AI Lên Kế Hoạch Xả Kho</button>
      </div>
    </div>
  `;
}

// ===== Competitor Page =====
let currentCompetitorProduct = 'Galaxy S24 Ultra';
function renderCompetitor() {
  const data = MOCK.competitor_prices[currentCompetitorProduct] || MOCK.competitor_prices['Galaxy S24 Ultra'];
  const max = Math.max(...data.history);
  const min = Math.min(...data.history);
  const range = max - min || 1;
  const points = data.history.map((v, i) => `${(i/(data.history.length-1))*100},${100 - ((v-min)/range)*80 - 10}`).join(' ');

  return `
    <div style="margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
      <label style="font-size:0.85rem;font-weight:600;">📦 Chọn sản phẩm theo dõi:</label>
      <select id="compProductSelect" class="settings-input" style="max-width:280px;">
        ${MOCK.competitor_products.map(p => `<option ${p===currentCompetitorProduct?'selected':''}>${p}</option>`).join('')}
      </select>
      <button class="btn-approve" style="margin-left:auto;">+ Theo dõi đối thủ mới</button>
    </div>

    <div class="grid-2">
      <div class="content-card">
        <div class="content-card-title">⚡ Hoạt động đối thủ — Live</div>
        <div class="activity-timeline">
          ${MOCK.competitors.map(c => `
            <div class="activity-item">
              <div class="activity-dot" style="background:${c.color};"></div>
              <div style="flex:1;">
                <div style="font-weight:700;">${c.name}</div>
                <div class="activity-text">${c.activity}</div>
                <div class="activity-time">${c.time}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="content-card">
        <div class="content-card-title">📈 Lịch sử giá 7 ngày — ${currentCompetitorProduct}</div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:160px;background:var(--bg-glass);border-radius:8px;padding:8px;box-sizing:border-box;">
          <polyline fill="none" stroke="#eab308" stroke-width="1.2" points="${points}"/>
          ${data.history.map((v,i) => `<circle cx="${(i/(data.history.length-1))*100}" cy="${100 - ((v-min)/range)*80 - 10}" r="1.2" fill="#eab308"/>`).join('')}
        </svg>
        <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--text-muted);margin-top:6px;">
          <span>7 ngày trước (${fmt.vnd(data.history[0])})</span>
          <span>Hôm nay (${fmt.vnd(data.history[data.history.length-1])})</span>
        </div>
      </div>
    </div>

    <div class="content-card" style="margin-top:20px;">
      <div class="content-card-title">💱 So sánh giá hiện tại — ${currentCompetitorProduct}</div>
      <table class="data-table" style="width:100%;font-size:0.85rem;">
        <thead><tr><th>Shop</th><th style="text-align:right;">Giá cũ</th><th style="text-align:right;">Giá mới</th><th style="text-align:right;">Khoảng cách với bạn</th><th>AI Đánh giá</th></tr></thead>
        <tbody>
          ${data.shops.map((s, i) => {
            const isMe = i === 0;
            const gapColor = s.gap < -3 ? 'var(--accent-rose)' : s.gap < 0 ? 'var(--accent-amber)' : 'var(--accent-emerald)';
            return `<tr ${isMe?'style="background:var(--accent-amber-bg);font-weight:700;"':''}>
              <td>${isMe?'⭐ ':''}${s.name}</td>
              <td style="text-align:right;">${s.old?fmt.vnd(s.old):'-'}</td>
              <td style="text-align:right;font-weight:700;">${fmt.vnd(s.new)}</td>
              <td style="text-align:right;color:${isMe?'var(--text-muted)':gapColor};">${isMe?'-':(s.gap>0?'+':'')+s.gap+'%'}</td>
              <td>${isMe?'<em>Shop của bạn</em>':s.gap < -3?'<span style="color:var(--accent-rose);">⚠ Cạnh tranh mạnh</span>':s.gap < 0?'<span style="color:var(--accent-amber);">Theo dõi</span>':'<span style="color:var(--accent-emerald);">An toàn</span>'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      <div style="margin-top:12px;padding:12px;background:var(--accent-amber-bg);border-radius:8px;font-size:0.85rem;">
        ${ICON.brain} <strong>AI khuyến nghị:</strong> Hoàng Hà đang bán rẻ hơn 5%. Đề xuất giảm 4% + tặng kèm ốp Spigen để giữ margin 11%. → <a href="#" data-nav="ai-suggestions" style="color:var(--accent-indigo);font-weight:700;">Xem đề xuất chi tiết</a>
      </div>
    </div>
  `;
}

// ===== Reviews Page =====
function renderReviews() {
  const k = MOCK.reviews_kpi;
  return `
    <div style="margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
      <label style="font-size:0.85rem;font-weight:600;">🔍 Lọc theo sản phẩm:</label>
      <select class="settings-input" style="max-width:280px;">
        <option>Tất cả sản phẩm</option>
        <option>AirPods Pro 2</option>
        <option>Galaxy S24 Ultra</option>
        <option>Cáp Anker 100W</option>
      </select>
    </div>

    <div class="grid-2">
      <div class="content-card" style="text-align:center;">
        <div style="font-size:3.5rem;font-weight:800;color:var(--text-heading);margin:8px 0;">${k.rating}</div>
        <div style="color:var(--accent-amber);font-size:1.2rem;letter-spacing:4px;">★★★★★</div>
        <div style="color:var(--text-muted);margin-top:8px;font-size:0.85rem;">${k.count.toLocaleString()} Đánh giá</div>
        <div style="margin-top:12px;padding:8px;background:var(--accent-emerald-bg);border-radius:6px;font-size:0.8rem;color:var(--accent-emerald);">
          ↑ Tăng ${k.trend_pos}% sentiment tích cực so với tháng trước
        </div>
      </div>

      <div class="content-card">
        <div class="content-card-title">${ICON.brain} Phân tích Cảm xúc (AI Sentiment)</div>
        <div class="rating-bars">
          <div class="rating-bar-row"><div class="rating-bar-label">😊</div><div class="rating-bar-track"><div class="rating-bar-fill" style="width:${k.positive}%;background:#10b981;"></div></div><div class="rating-bar-count">${k.positive}%</div></div>
          <div class="rating-bar-row"><div class="rating-bar-label">😐</div><div class="rating-bar-track"><div class="rating-bar-fill" style="width:${k.neutral}%;background:#f59e0b;"></div></div><div class="rating-bar-count">${k.neutral}%</div></div>
          <div class="rating-bar-row"><div class="rating-bar-label">😡</div><div class="rating-bar-track"><div class="rating-bar-fill" style="width:${k.negative}%;background:#ef4444;"></div></div><div class="rating-bar-count">${k.negative}%</div></div>
        </div>
        <div style="margin-top:14px;display:flex;gap:6px;flex-wrap:wrap;">
          ${MOCK.review_tags_pos.map(t => `<span class="tag-item" style="background:var(--accent-emerald-bg);color:var(--accent-emerald);">✅ ${t}</span>`).join('')}
          ${MOCK.review_tags_neg.map(t => `<span class="tag-item" style="background:var(--accent-rose-bg);color:var(--accent-rose);">❌ ${t}</span>`).join('')}
        </div>
      </div>
    </div>

    <div class="content-card" style="margin-top:20px;">
      <div class="content-card-title">⭐ Reviews Nổi Bật</div>
      <div class="grid-2" style="gap:14px;">
        ${MOCK.reviews.map(r => `
          <div class="review-card">
            <div class="review-card-header">
              <strong class="review-card-author">${r.author}</strong>
              <span class="review-card-date">${r.date}</span>
            </div>
            <div class="star-display" style="color:var(--accent-amber);">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
            <p class="review-card-text">${r.text}</p>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
              <span class="tag-item" style="background:${r.tag.type==='pos'?'var(--accent-emerald-bg)':'var(--accent-rose-bg)'};color:${r.tag.type==='pos'?'var(--accent-emerald)':'var(--accent-rose)'};">
                ${r.tag.type==='pos'?'Điểm khen':'Vấn đề'}: ${r.tag.label}
              </span>
              ${r.rating <= 3 ? `<button class="btn-sug-detail" data-action="ai-reply" data-author="${r.author}">${ICON.brain} AI soạn phản hồi</button>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ===== Media & Ads Page =====
function renderMedia() {
  const k = MOCK.ads_kpi;
  return `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-card-label">Ngân sách Tuần</div><div class="stat-card-value">${fmt.currency(k.budget_week)}đ</div></div>
      <div class="stat-card"><div class="stat-card-label">Đã Tiêu</div><div class="stat-card-value">${fmt.currency(k.spent)}đ</div></div>
      <div class="stat-card"><div class="stat-card-label">Doanh thu mang về</div><div class="stat-card-value" style="color:var(--accent-emerald);">${fmt.currency(k.revenue)}đ</div></div>
      <div class="stat-card"><div class="stat-card-label">ROAS</div><div class="stat-card-value" style="color:var(--accent-amber);">${k.roas}x</div></div>
    </div>

    <div class="content-card" style="margin-top:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div class="content-card-title" style="margin:0;">📈 Hiệu Suất Quảng Cáo</div>
        <button class="btn-approve">${ICON.brain} AI Phân bổ lại ngân sách tối ưu</button>
      </div>
      <table class="data-table" style="width:100%;font-size:0.85rem;">
        <thead><tr><th>Campaign</th><th>Kênh</th><th style="text-align:right;">Chi phí</th><th style="text-align:right;">Chuyển đổi</th><th style="text-align:right;">ROAS</th><th>AI Action</th></tr></thead>
        <tbody>
          ${MOCK.ads_campaigns.map(c => {
            const aMap = {
              scale: { color:'#10b981', bg:'var(--accent-emerald-bg)', label:'⬆ Tự Build Scale budget' },
              maintain: { color:'#0ea5e9', bg:'rgba(14,165,233,0.15)', label:'→ Duy trì' },
              cut: { color:'#ef4444', bg:'var(--accent-rose-bg)', label:'⬇ Tự Cắt giảm' }
            }[c.action];
            return `<tr>
              <td><strong>${c.name}</strong></td>
              <td>${c.channel}</td>
              <td style="text-align:right;">${fmt.vnd(c.cost)}</td>
              <td style="text-align:right;">${c.conv} đơn</td>
              <td style="text-align:right;font-weight:700;color:${c.roas>=3?'var(--accent-emerald)':'var(--accent-rose)'};">${c.roas}x</td>
              <td>
                <span class="table-badge" style="background:${aMap.bg};color:${aMap.color};cursor:help;" title="${c.ai_reason}">${aMap.label}</span>
                <div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px;">${c.ai_reason}</div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div class="content-card" style="margin-top:16px;">
      <div class="content-card-title">📊 Dự báo nếu phân bổ lại</div>
      <p style="font-size:0.9rem;color:var(--text-secondary);">Nếu chuyển 1.7M ngân sách từ "Ốp Silicon" (ROAS 0.8x) sang "AirPods Pro 2" (ROAS 12.5x), AI dự báo:</p>
      <div class="grid-3" style="margin-top:12px;">
        <div class="big-metric"><div class="big-metric-value" style="color:var(--accent-emerald);">+8.2M</div><div class="big-metric-label">Doanh thu thêm/tuần</div></div>
        <div class="big-metric"><div class="big-metric-value" style="color:var(--accent-emerald);">9.1x</div><div class="big-metric-label">ROAS trung bình mới</div></div>
        <div class="big-metric"><div class="big-metric-value" style="color:var(--accent-emerald);">+12 đơn</div><div class="big-metric-label">Số đơn dự kiến/tuần</div></div>
      </div>
    </div>
  `;
}

// ===== Chat Page (Smart Multi-Agent Demo) =====
let currentChatId = 'c2';
let chatFilter = 'all';
let chatDraftEditMode = false;  // true khi đang ở chế độ chỉnh sửa nháp

function sentimentBar(score) {
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 70 ? '😊' : score >= 40 ? '😐' : '😡';
  return `<div style="display:flex;align-items:center;gap:6px;">
    <span>${label}</span>
    <div style="flex:1;height:4px;background:#e5e7eb;border-radius:2px;">
      <div style="width:${score}%;height:100%;background:${color};border-radius:2px;"></div>
    </div>
    <span style="font-size:0.7rem;font-weight:700;color:${color};">${score}</span>
  </div>`;
}

function priorityDot(p) {
  const map = {0:'#ef4444',1:'#f59e0b',2:'#10b981',3:'#0ea5e9'};
  const lbl = {0:'Khẩn',1:'Cao',2:'TB',3:'Thấp'};
  return `<span style="display:inline-flex;align-items:center;gap:3px;font-size:0.65rem;font-weight:700;color:${map[p]};">
    <span style="width:6px;height:6px;border-radius:50%;background:${map[p]};display:inline-block;"></span>${lbl[p]}
  </span>`;
}

function renderChat() {
  const conv = MOCK.conversations.find(c => c.id === currentChatId) || MOCK.conversations[0];
  const messages = MOCK.chat_messages[currentChatId] || [];
  const filtered = chatFilter === 'all' ? MOCK.conversations
    : chatFilter === 'pending' ? MOCK.conversations.filter(c => c.status === 'pending')
    : chatFilter === 'escalate' ? MOCK.conversations.filter(c => c.status === 'escalate')
    : MOCK.conversations.filter(c => c.status === 'auto');

  return `
    <!-- ── Top KPI Strip ── -->
    <div class="stats-grid" style="margin-bottom:16px;">
      <div class="stat-card" style="padding:14px 18px;">
        <div class="stat-card-label">Tin nhắn hôm nay</div>
        <div class="stat-card-value" style="font-size:1.4rem;">847</div>
        <span class="stat-card-trend" style="color:var(--accent-emerald);background:var(--accent-emerald-bg);">↑ 91% tự động</span>
      </div>
      <div class="stat-card" style="padding:14px 18px;">
        <div class="stat-card-label">Thời gian phản hồi TB</div>
        <div class="stat-card-value" style="font-size:1.4rem;color:var(--accent-emerald);">12s</div>
        <span style="font-size:0.72rem;color:var(--text-muted);">↓ từ 8 phút trước khi dùng AI</span>
      </div>
      <div class="stat-card" style="padding:14px 18px;border-color:var(--accent-rose);">
        <div class="stat-card-label">⚠ Chờ xử lý khẩn</div>
        <div class="stat-card-value" style="font-size:1.4rem;color:var(--accent-rose);">2</div>
        <span style="font-size:0.72rem;color:var(--accent-rose);">Lê C: 51p · Hoàng Mạnh: 71p</span>
      </div>
      <div class="stat-card" style="padding:14px 18px;">
        <div class="stat-card-label">Doanh thu từ chat hôm nay</div>
        <div class="stat-card-value" style="font-size:1.4rem;color:var(--accent-amber);">+18.5M</div>
        <span style="font-size:0.72rem;color:var(--text-muted);">từ 43 cuộc hội thoại AI chốt đơn</span>
      </div>
    </div>

    <!-- ── 3-Panel Layout ── -->
    <div style="display:grid;grid-template-columns:300px 1fr 280px;gap:16px;min-height:620px;">

      <!-- Panel 1: Conversation List -->
      <div class="content-card" style="padding:0;overflow:hidden;display:flex;flex-direction:column;">
        <div style="padding:14px 16px;border-bottom:1px solid var(--border-primary);">
          <div style="font-weight:700;font-size:0.9rem;margin-bottom:10px;">Hộp Thư — Smart AI</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;">
            ${['all','escalate','pending','auto'].map(f => {
              const lMap = {all:'Tất cả',escalate:'🔴 Khẩn',pending:'🟡 Chờ duyệt',auto:'✅ Tự động'};
              const cnt = f==='all'?MOCK.conversations.length:MOCK.conversations.filter(c=>c.status===f).length;
              return `<button class="ai-sug-tab small ${chatFilter===f?'active':''}" data-chatfilter="${f}" style="font-size:0.7rem;padding:4px 8px;">${lMap[f]} ${cnt}</button>`;
            }).join('')}
          </div>
        </div>
        <div style="overflow-y:auto;flex:1;">
          ${filtered.map(c => {
            const urgentColor = c.priority===0?'var(--accent-rose)':c.priority===1?'var(--accent-amber)':'transparent';
            return `
            <div class="chat-conv-item ${c.id===currentChatId?'active':''}" data-conv="${c.id}"
                 style="border-left:3px solid ${urgentColor};padding:12px 12px 10px;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;width:100%;">
                <div style="display:flex;gap:8px;align-items:flex-start;flex:1;min-width:0;">
                  <div class="chat-conv-avatar" style="flex-shrink:0;width:34px;height:34px;font-size:0.85rem;">${c.avatar}</div>
                  <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
                      <span style="font-weight:700;font-size:0.83rem;">${c.name}</span>
                      ${c.vip?'<span title="VIP" style="color:var(--accent-amber);font-size:0.7rem;">⭐</span>':''}
                      ${c.returning?'<span title="Khách quen" style="font-size:0.65rem;color:var(--accent-blue);background:rgba(14,165,233,0.1);padding:1px 4px;border-radius:3px;">QUEN</span>':''}
                    </div>
                    <div style="font-size:0.75rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:160px;">${c.preview}</div>
                    <div style="display:flex;gap:6px;align-items:center;margin-top:4px;flex-wrap:wrap;">
                      ${priorityDot(c.priority)}
                      <span style="font-size:0.65rem;color:var(--text-muted);">${c.category}</span>
                    </div>
                  </div>
                </div>
                <div style="text-align:right;flex-shrink:0;margin-left:6px;">
                  <div style="font-size:0.7rem;color:var(--text-muted);">${c.time}</div>
                  ${c.wait_min>0?`<div style="font-size:0.65rem;font-weight:700;color:${c.wait_min>45?'var(--accent-rose)':'var(--accent-amber)'};">⏱ ${c.wait_min}p</div>`:''}
                  ${c.unread?`<div style="width:8px;height:8px;border-radius:50%;background:var(--accent-rose);margin:4px 0 0 auto;"></div>`:''}
                </div>
              </div>
              <div style="margin-top:6px;">${sentimentBar(c.sentiment)}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Panel 2: Chat Detail -->
      <div class="content-card" style="padding:0;overflow:hidden;display:flex;flex-direction:column;">
        <!-- Header -->
        <div style="padding:12px 16px;border-bottom:1px solid var(--border-primary);background:var(--bg-glass);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-weight:700;font-size:0.95rem;">${conv.name}
                ${conv.vip?'<span style="color:var(--accent-amber);font-size:0.75rem;">⭐ VIP</span>':''}
                ${conv.angry?'<span style="color:var(--accent-rose);font-size:0.75rem;">😡 Cảm xúc tiêu cực</span>':''}
              </div>
              <div style="display:flex;gap:12px;margin-top:2px;font-size:0.72rem;color:var(--text-muted);">
                <span>📦 ${conv.platform}</span>
                <span>🏷 ${conv.category}</span>
                ${conv.wait_min>0?`<span style="color:${conv.wait_min>45?'var(--accent-rose)':'var(--accent-amber)'};">⏱ Chờ ${conv.wait_min} phút</span>`:'<span style="color:var(--accent-emerald);">✅ Đã phản hồi</span>'}
              </div>
            </div>
            <div style="display:flex;gap:6px;">
              <button class="btn-chat-action" style="font-size:0.75rem;padding:6px 10px;">✅ Đóng</button>
              <button class="btn-chat-action" style="font-size:0.75rem;padding:6px 10px;">🏷 Gắn tag</button>
            </div>
          </div>
        </div>

        <!-- Messages -->
        <div class="chat-detail-messages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;">
          ${messages.map(m => {
            if (m.from === 'customer') {
              return `<div style="align-self:flex-start;max-width:85%;">
                <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:4px;">${conv.name} · ${m.time}</div>
                <div class="chat-bubble" style="background:#f1f5f9;padding:10px 14px;border-radius:0 12px 12px 12px;">${m.text}</div>
              </div>`;
            }
            if (m.from === 'ai_thinking') {
              return `<div style="background:linear-gradient(135deg,rgba(234,179,8,0.08),rgba(234,179,8,0.03));padding:12px 14px;border-radius:10px;border-left:3px solid var(--accent-amber);">
                <div style="font-weight:700;color:var(--accent-indigo);font-size:0.8rem;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                  ${ICON.brain} <span>Context AI đang phân tích</span>
                </div>
                ${m.context?`<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
                  ${m.context.map(cx=>`<div style="font-size:0.72rem;color:var(--text-secondary);padding:3px 6px;background:rgba(255,255,255,0.6);border-radius:4px;">${cx}</div>`).join('')}
                </div>`:''}
              </div>`;
            }
            if (m.from === 'ai_draft') {
              if (chatDraftEditMode) {
                // ── CHẾ ĐỘ CHỈNH SỬA ──
                return `<div style="background:rgba(99,102,241,0.07);padding:14px;border-radius:10px;border-left:3px solid var(--accent-indigo);">
                  <div style="font-weight:700;font-size:0.78rem;color:var(--accent-indigo);margin-bottom:8px;">
                    ✏️ Đang chỉnh sửa nháp AI — Sửa xong nhấn Gửi
                  </div>
                  <textarea id="chatDraftEditArea" style="width:100%;min-height:90px;border-radius:8px;padding:10px;font-size:0.86rem;
                    line-height:1.6;border:1px solid var(--accent-indigo);background:var(--bg-card);
                    color:var(--text-primary);resize:vertical;font-family:inherit;">${m.text}</textarea>
                  <div style="display:flex;gap:8px;margin-top:10px;">
                    <button class="btn-chat-send-edited btn-approve" style="flex:1;">✅ Gửi bản đã sửa</button>
                    <button class="btn-chat-cancel-edit btn-modal-cancel" style="padding:8px 14px;">✕ Hủy</button>
                  </div>
                </div>`;
              }
              // ── CHẾ ĐỘ XEM THƯỜNG ──
              return `<div style="background:var(--accent-emerald-bg);padding:14px;border-radius:10px;border-left:3px solid var(--accent-emerald);">
                <div style="display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:0.78rem;color:var(--accent-emerald);margin-bottom:8px;">
                  <span>🤖 NHÁP AI — Chờ duyệt</span>
                  ${m.confidence?`<span style="background:var(--accent-emerald);color:white;padding:2px 8px;border-radius:10px;font-size:0.7rem;">Confidence ${m.confidence}%</span>`:''}
                </div>
                <div style="color:var(--text-primary);line-height:1.6;margin-bottom:12px;font-size:0.88rem;">${m.text}</div>
                <div style="display:flex;gap:8px;">
                  <button class="btn-chat-accept" style="flex:1;">✅ Gửi ngay</button>
                  <button class="btn-chat-edit" style="flex:1;">✏ Sửa nháp</button>
                  <button class="btn-chat-deny" data-action="deny-chat" style="padding:8px 12px;border-radius:8px;border:1px solid var(--border-primary);background:var(--bg-glass);cursor:pointer;font-size:0.85rem;">❌</button>
                </div>
              </div>`;
            }
            if (m.from === 'ai_sent') {
              return `<div style="align-self:flex-end;max-width:85%;">
                <div style="font-size:0.7rem;color:var(--accent-emerald);margin-bottom:4px;text-align:right;">
                  🤖 AI Agent · ${m.time}${m.edited?' · ✏ Đã chỉnh sửa':''}
                </div>
                <div class="chat-bubble" style="background:var(--accent-emerald-bg);padding:10px 14px;border-radius:12px 0 12px 12px;border:1px solid var(--accent-emerald)40;">${m.text}</div>
              </div>`;
            }
            if (m.from === 'shop_owner') {
              return `<div style="align-self:flex-end;max-width:85%;">
                <div style="font-size:0.7rem;color:var(--accent-indigo);margin-bottom:4px;text-align:right;">👤 Chủ shop · ${m.time}</div>
                <div class="chat-bubble" style="background:rgba(99,102,241,0.1);padding:10px 14px;border-radius:12px 0 12px 12px;border:1px solid rgba(99,102,241,0.3);">${m.text}</div>
              </div>`;
            }
            if (m.from === 'system') {
              return `<div style="background:var(--accent-rose-bg);padding:10px 14px;border-radius:8px;font-size:0.82rem;color:var(--accent-rose);font-weight:600;">${m.text}</div>`;
            }
            return '';
          }).join('')}
        </div>

        <!-- Input -->
        <div style="padding:12px 14px;border-top:1px solid var(--border-primary);">
          <div style="display:flex;gap:8px;">
            <input type="text" id="chatMsgInput" class="settings-input" style="flex:1;font-size:0.85rem;" placeholder="Nhập tin nhắn hoặc ra lệnh cho AI...">
            <button class="btn-approve" data-action="chat-send-msg" style="white-space:nowrap;">Gửi →</button>
          </div>
          <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
            ${['Xin lỗi + hỗ trợ đổi hàng','Gửi link bảo hành','Báo giá sỉ','Xác nhận đơn hàng'].map(t=>`<button class="guidance-tag" data-chattemplate="${t}" style="font-size:0.7rem;padding:4px 8px;">${t}</button>`).join('')}
          </div>
        </div>
      </div>

      <!-- Panel 3: Customer Context Sidebar -->
      <div style="display:flex;flex-direction:column;gap:12px;">
        <!-- Customer Profile -->
        <div class="content-card" style="padding:14px;">
          <div style="font-weight:700;font-size:0.82rem;color:var(--text-muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">Hồ sơ khách hàng</div>
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:12px;">
            <div style="width:40px;height:40px;border-radius:50%;background:var(--gradient-primary);display:flex;align-items:center;justify-content:center;font-weight:800;color:#451a03;flex-shrink:0;">${conv.avatar}</div>
            <div>
              <div style="font-weight:700;font-size:0.9rem;">${conv.name}</div>
              <div style="font-size:0.72rem;color:var(--text-muted);">${conv.platform} · ${conv.orders} đơn hàng</div>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
            <div style="background:var(--bg-glass);border-radius:8px;padding:8px;text-align:center;">
              <div style="font-size:1rem;font-weight:800;color:var(--accent-amber);">${fmt.currency(conv.ltv)}đ</div>
              <div style="font-size:0.68rem;color:var(--text-muted);">Tổng chi tiêu</div>
            </div>
            <div style="background:var(--bg-glass);border-radius:8px;padding:8px;text-align:center;">
              <div style="font-size:1rem;font-weight:800;color:${conv.customer.risk==='high'?'var(--accent-rose)':conv.customer.risk==='medium'?'var(--accent-amber)':'var(--accent-emerald)'};">${conv.customer.churn}</div>
              <div style="font-size:0.68rem;color:var(--text-muted);">Xác suất rời bỏ</div>
            </div>
          </div>
          <div style="font-size:0.75rem;padding:8px;background:${conv.customer.risk==='high'?'var(--accent-rose-bg)':conv.customer.risk==='medium'?'var(--accent-amber-bg)':'var(--accent-emerald-bg)'};border-radius:6px;color:${conv.customer.risk==='high'?'var(--accent-rose)':conv.customer.risk==='medium'?'var(--accent-amber)':'var(--accent-emerald)'};">
            ${ICON.brain} ${conv.customer.note}
          </div>
        </div>

        <!-- Purchase History -->
        <div class="content-card" style="padding:14px;">
          <div style="font-weight:700;font-size:0.82rem;color:var(--text-muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">Lịch sử mua hàng</div>
          ${conv.customer.purchases.map(p => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-primary);font-size:0.78rem;">
              <div>
                <div style="font-weight:600;">${p.item}</div>
                <div style="color:var(--text-muted);">${p.date}</div>
              </div>
              <div style="font-weight:700;color:var(--accent-indigo);">${fmt.currency(p.value)}đ</div>
            </div>
          `).join('')}
        </div>

        <!-- AI Recommended Action -->
        <div class="content-card" style="padding:14px;border-color:var(--accent-amber);">
          <div style="font-weight:700;font-size:0.82rem;color:var(--accent-indigo);margin-bottom:10px;">${ICON.brain} Hành động AI đề xuất</div>
          ${conv.status==='escalate'?`
            <div style="font-size:0.8rem;line-height:1.6;">
              <div style="color:var(--accent-rose);font-weight:700;margin-bottom:6px;">🚨 Cần xử lý ngay</div>
              <div style="color:var(--text-secondary);">1. Xác nhận đơn hàng và kiểm tra lỗi</div>
              <div style="color:var(--text-secondary);">2. Gửi lời xin lỗi + cam kết xử lý 24h</div>
              <div style="color:var(--text-secondary);">3. Đề xuất đổi hàng hoặc hoàn tiền</div>
              <div style="color:var(--text-secondary);">4. Gắn tag "Lỗi lô hàng" để theo dõi</div>
            </div>
            <button class="btn-approve" style="width:100%;margin-top:10px;">Áp dụng kịch bản xử lý</button>
          `:conv.status==='pending'?`
            <div style="font-size:0.8rem;line-height:1.6;color:var(--text-secondary);">
              Đề xuất tối ưu doanh thu từ khách VIP:<br>Giảm 4% + tặng ốp Spigen → margin vẫn giữ 11%
            </div>
            <button class="btn-approve" style="width:100%;margin-top:10px;">Dùng đề xuất AI</button>
          `:`
            <div style="font-size:0.8rem;color:var(--text-secondary);">Cuộc hội thoại đang được xử lý tốt. Không cần can thiệp.</div>
          `}
        </div>
      </div>
    </div>

    <!-- ── Issue Clusters (AI Pattern Detection) ── -->
    <div class="content-card" style="margin-top:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div class="content-card-title" style="margin:0;">${ICON.brain} Vấn đề nổi cộm — AI phát hiện từ toàn bộ chat (7 ngày)</div>
        <span style="font-size:0.75rem;color:var(--text-muted);">Từ 847 cuộc hội thoại</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:0;">
        ${MOCK.chat_clusters.map((cl,i) => `
          <div style="display:flex;align-items:center;gap:14px;padding:12px 0;${i<MOCK.chat_clusters.length-1?'border-bottom:1px solid var(--border-primary);':''}">
            <div style="font-size:1.2rem;flex-shrink:0;">${cl.icon}</div>
            <div style="flex:1;">
              <div style="display:flex;align-items:center;gap:8px;">
                <strong style="font-size:0.88rem;">${cl.label}</strong>
                <span style="background:${cl.urgent?'var(--accent-rose-bg)':'var(--accent-amber-bg)'};color:${cl.urgent?'var(--accent-rose)':'var(--accent-amber)'};font-size:0.68rem;font-weight:700;padding:2px 6px;border-radius:4px;">${cl.count} khách</span>
              </div>
              <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px;">Impact: ${cl.impact}</div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div style="font-size:0.75rem;color:var(--accent-indigo);font-weight:600;margin-bottom:4px;">→ ${cl.action}</div>
              <button class="alert-cta" style="font-size:0.72rem;">Xử lý ngay</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- ── Proactive Outreach ── -->
    <div class="content-card" style="margin-top:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div class="content-card-title" style="margin:0;">📣 AI gợi ý chủ động liên hệ (Proactive Outreach)</div>
        <button class="btn-approve">Gửi tất cả</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:0;">
        ${MOCK.proactive_targets.map((t,i) => `
          <div style="display:flex;align-items:center;gap:14px;padding:12px 0;${i<MOCK.proactive_targets.length-1?'border-bottom:1px solid var(--border-primary);':''}">
            <div style="width:36px;height:36px;border-radius:50%;background:var(--accent-indigo-bg);color:var(--accent-indigo);display:flex;align-items:center;justify-content:center;font-weight:800;flex-shrink:0;">${t.name[0]}</div>
            <div style="flex:1;">
              <div style="font-weight:700;font-size:0.85rem;">${t.name}</div>
              <div style="font-size:0.75rem;color:var(--text-muted);">${t.reason}</div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
              <div style="font-size:0.78rem;font-weight:700;color:var(--accent-emerald);margin-bottom:6px;">${t.value}</div>
              <button class="alert-cta">${t.action} →</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}


// ===== Crisis Center Page =====
let currentCrisisId = 'cr-001';
let crisisActionDraft = null;

function renderCrisisCenter() {
  const crisis = MOCK.crises.find(c => c.id === currentCrisisId) || MOCK.crises[0];
  const sevColor = crisis.severity === 'critical' ? '#ef4444' : crisis.severity === 'warning' ? '#f59e0b' : '#10b981';
  const sevBg = crisis.severity === 'critical' ? 'rgba(239,68,68,0.1)' : crisis.severity === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)';
  const sevLabel = crisis.severity === 'critical' ? '🔴 MỨC ĐỎ' : crisis.severity === 'warning' ? '🟡 MỨC VÀNG' : '🟢 THEO DÕI';
  const doneCount = crisis.actions.filter(a=>a.status==='done').length;

  return `
    <!-- Crisis Selector Tabs -->
    <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
      ${MOCK.crises.map(cr => {
        const c = cr.severity==='critical'?'#ef4444':cr.severity==='warning'?'#f59e0b':'#10b981';
        return `<button data-crisisid="${cr.id}" style="padding:10px 18px;border-radius:10px;border:2px solid ${cr.id===currentCrisisId?c:'var(--border-primary)'};background:${cr.id===currentCrisisId?c+'18':'var(--bg-card)'};font-weight:700;font-size:0.83rem;cursor:pointer;color:${cr.id===currentCrisisId?c:'var(--text-secondary)'};display:flex;align-items:center;gap:8px;">
          ${cr.severity==='critical'?'🔴':cr.severity==='warning'?'🟡':'🟢'} ${cr.product}
          <span style="background:${c};color:white;border-radius:10px;padding:1px 7px;font-size:0.7rem;">${cr.severity_score}</span>
        </button>`;
      }).join('')}
    </div>

    <!-- Header Card -->
    <div style="background:linear-gradient(135deg,${crisis.severity==='critical'?'#450a0a,#7f1d1d':'#451a03,#78350f'});border-radius:var(--radius-lg);padding:20px 24px;margin-bottom:20px;border:1px solid ${sevColor};">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
        <div>
          <div style="color:${sevColor};font-size:0.72rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">${sevLabel} · Phát hiện lúc ${crisis.detected_at}</div>
          <div style="color:#fff;font-size:1.4rem;font-weight:800;margin:6px 0;">${crisis.product}</div>
          <div style="color:#fca5a5;font-size:0.82rem;">${crisis.sku} · ${crisis.orchestrator.root_cause.substring(0,80)}...</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;flex-shrink:0;">
          <div style="text-align:center;padding:12px;background:rgba(0,0,0,0.3);border-radius:10px;">
            <div style="font-size:1.6rem;font-weight:900;color:${sevColor};">${crisis.severity_score}</div>
            <div style="font-size:0.68rem;color:#fca5a5;margin-top:2px;">Severity Score</div>
          </div>
          <div style="text-align:center;padding:12px;background:rgba(0,0,0,0.3);border-radius:10px;">
            <div style="font-size:1.6rem;font-weight:900;color:#f87171;">${crisis.affected_customers}</div>
            <div style="font-size:0.68rem;color:#fca5a5;margin-top:2px;">Khách ảnh hưởng</div>
          </div>
          <div style="text-align:center;padding:12px;background:rgba(0,0,0,0.3);border-radius:10px;">
            <div style="font-size:1.3rem;font-weight:900;color:#fb923c;">${fmt.currency(crisis.revenue_at_risk)}đ</div>
            <div style="font-size:0.68rem;color:#fca5a5;margin-top:2px;">Doanh thu rủi ro</div>
          </div>
        </div>
      </div>
      <div style="margin-top:16px;padding:12px 16px;background:rgba(0,0,0,0.25);border-radius:10px;font-size:0.82rem;color:#fecaca;line-height:1.7;">
        ${ICON.brain} <strong style="color:#f87171;">Orchestrator phân tích:</strong> ${crisis.orchestrator.root_cause}
        <span style="margin-left:12px;background:rgba(239,68,68,0.3);color:#f87171;padding:2px 8px;border-radius:6px;font-size:0.72rem;">Độ tin cậy: ${crisis.orchestrator.confidence}%</span>
      </div>
    </div>

    <!-- 3 Agent Signals -->
    <div style="margin-bottom:20px;">
      <div style="font-weight:700;font-size:0.85rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">📡 Tín hiệu từ các AI Agent</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;">
        ${crisis.signals.map((sig, si) => `
          <div style="background:var(--bg-card);border:1px solid ${sig.color}44;border-radius:var(--radius-lg);padding:18px;border-left:4px solid ${sig.color};">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
              <div style="font-size:1.5rem;">${sig.icon}</div>
              <div>
                <div style="font-weight:800;font-size:0.88rem;color:${sig.color};">${sig.agent}</div>
                <div style="font-size:0.7rem;color:var(--text-muted);">Phát hiện lúc ${sig.detected_at}</div>
              </div>
              <div style="margin-left:auto;background:${sig.color}18;color:${sig.color};padding:3px 8px;border-radius:6px;font-size:0.7rem;font-weight:700;">ACTIVE</div>
            </div>
            <div style="font-weight:700;font-size:0.88rem;margin-bottom:6px;">${sig.title}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:12px;">${sig.detail}</div>
            ${sig.evidence && sig.evidence.length ? `
              <div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:6px;">Bằng chứng (${sig.evidence.length}):</div>
              <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto;">
                ${sig.evidence.map(ev => `
                  <div style="background:var(--bg-glass);border-radius:8px;padding:8px 10px;font-size:0.76rem;border-left:2px solid ${sig.color}66;">
                    ${ev.type === 'review' ? `<span style="color:var(--accent-rose);">${'★'.repeat(ev.rating)}${'☆'.repeat(5-ev.rating)}</span> <strong>${ev.author}:</strong> "${ev.text}"` : ''}
                    ${ev.type === 'chat' ? `💬 <strong>${ev.author}</strong> · ${ev.time}: "${ev.text}"` : ''}
                    ${ev.type === 'tiktok' ? `🎵 <strong>${ev.account}</strong> — ${ev.views.toLocaleString()} views · ${ev.likes.toLocaleString()} likes · ${ev.comments} bình luận<br><span style="color:var(--accent-rose);font-weight:600;">${ev.trend}</span><br><em style="color:var(--text-muted);">${ev.text.substring(0,80)}...</em>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : '<div style="font-size:0.78rem;color:var(--text-muted);font-style:italic;">Đang thu thập thêm bằng chứng...</div>'}
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Main Grid: Action Plan + Affected Customers -->
    <div style="display:grid;grid-template-columns:1fr 340px;gap:16px;margin-bottom:20px;">

      <!-- Action Checklist -->
      <div class="content-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div class="content-card-title" style="margin:0;">✅ Kế hoạch xử lý khủng hoảng</div>
          <div style="font-size:0.8rem;color:var(--text-muted);">${doneCount}/${crisis.actions.length} hoàn thành</div>
        </div>
        <div style="height:6px;background:var(--bg-glass);border-radius:3px;margin-bottom:18px;overflow:hidden;">
          <div style="height:100%;width:${Math.round(doneCount/crisis.actions.length*100)}%;background:var(--gradient-success);border-radius:3px;transition:width 0.5s;"></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${crisis.actions.map((act, ai) => {
            const prioColor = act.priority==='critical'?'#ef4444':act.priority==='high'?'#f59e0b':act.priority==='medium'?'#0ea5e9':'#94a3b8';
            const prioLabel = act.priority==='critical'?'KHẨN':act.priority==='high'?'CAO':act.priority==='medium'?'TRUNG BÌNH':'THẤP';
            return `
              <div style="border:1px solid ${act.status==='done'?'var(--accent-emerald)':'var(--border-primary)'};border-radius:12px;padding:14px 16px;background:${act.status==='done'?'var(--accent-emerald-bg)':'var(--bg-card)'};transition:all 0.2s;">
                <div style="display:flex;align-items:flex-start;gap:12px;">
                  <div style="width:28px;height:28px;border-radius:50%;background:${act.status==='done'?'var(--accent-emerald)':prioColor+'22'};border:2px solid ${act.status==='done'?'var(--accent-emerald)':prioColor};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.75rem;font-weight:800;color:${act.status==='done'?'white':prioColor};">
                    ${act.status==='done'?'✓':act.order}
                  </div>
                  <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
                      <span style="font-weight:700;font-size:0.88rem;${act.status==='done'?'text-decoration:line-through;color:var(--text-muted);':''}">${act.title}</span>
                      <span style="background:${prioColor}18;color:${prioColor};font-size:0.65rem;font-weight:700;padding:2px 6px;border-radius:4px;">${prioLabel}</span>
                      ${act.status==='done'?`<span style="color:var(--accent-emerald);font-size:0.72rem;">✓ ${act.done_by} · ${act.done_at}</span>`:''}
                    </div>
                    <div style="font-size:0.78rem;color:var(--text-muted);">${act.detail}</div>
                    ${act.status !== 'done' ? `
                      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
                        <button class="btn-crisis-action" data-actid="${act.id}" data-crisisid="${crisis.id}" style="background:${prioColor};color:white;border:none;padding:7px 14px;border-radius:7px;font-size:0.78rem;font-weight:700;cursor:pointer;">
                          ${act.id==='act-2'?'🙈 Ẩn sản phẩm':act.id==='act-3'?'💌 Gửi voucher ngay':act.id==='act-4'?'📧 Gửi email NCC':act.id==='act-5'?'📢 Đăng thông báo':act.id==='act-6'?'💬 Comment TikTok':'✅ Thực hiện'}
                        </button>
                        ${act.draft ? `<button class="btn-crisis-draft" data-actid="${act.id}" data-crisisid="${crisis.id}" style="background:var(--bg-glass);color:var(--text-secondary);border:1px solid var(--border-primary);padding:7px 14px;border-radius:7px;font-size:0.78rem;cursor:pointer;">📝 Xem nháp AI</button>` : ''}
                      </div>
                    ` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Right Column: Customers + Timeline -->
      <div style="display:flex;flex-direction:column;gap:14px;">

        <!-- Affected Customers -->
        <div class="content-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div class="content-card-title" style="margin:0;font-size:0.85rem;">👥 Khách bị ảnh hưởng (${crisis.affected_customers_list.length})</div>
            <button class="btn-approve" style="font-size:0.72rem;padding:5px 10px;">Gửi tất cả</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;max-height:260px;overflow-y:auto;">
            ${crisis.affected_customers_list.map(cu => `
              <div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg-glass);border-radius:8px;">
                <div style="width:30px;height:30px;border-radius:50%;background:var(--accent-rose-bg);color:var(--accent-rose);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.75rem;flex-shrink:0;">${cu.name[0]}</div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:0.8rem;font-weight:600;">${cu.name}</div>
                  <div style="font-size:0.68rem;color:var(--text-muted);">${cu.platform} · ${cu.order_date}</div>
                </div>
                <div style="text-align:right;flex-shrink:0;">
                  <div style="font-size:0.65rem;color:${cu.status.includes('★')?'var(--accent-rose)':'var(--accent-amber)'};font-weight:700;">${cu.status}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Event Timeline -->
        <div class="content-card">
          <div class="content-card-title" style="font-size:0.85rem;margin-bottom:12px;">⏱ Timeline phát hiện</div>
          <div style="display:flex;flex-direction:column;gap:0;position:relative;">
            <div style="position:absolute;left:18px;top:0;bottom:0;width:2px;background:var(--border-primary);"></div>
            ${crisis.timeline.map((ev, ti) => {
              const agColor = ev.agent==='Market Agent'?'#ef4444':ev.agent==='Chat Agent'?'#f59e0b':ev.agent==='Content Agent'?'#0ea5e9':ev.agent==='Orchestrator'?'#8b5cf6':'#10b981';
              return `
              <div style="display:flex;gap:12px;padding-bottom:14px;position:relative;">
                <div style="width:38px;height:38px;border-radius:50%;background:${agColor}18;border:2px solid ${agColor};display:flex;align-items:center;justify-content:center;font-size:0.62rem;font-weight:700;color:${agColor};flex-shrink:0;z-index:1;background:white;">${ev.time}</div>
                <div style="padding-top:6px;">
                  <div style="font-size:0.72rem;font-weight:700;color:${agColor};">${ev.agent}</div>
                  <div style="font-size:0.75rem;color:var(--text-secondary);line-height:1.4;">${ev.event}</div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- AI Draft Modal placeholder (shown inline) -->
    <div id="crisisDraftPanel" style="display:none;"></div>
  `;
}

// ===== Settings Page (4 Tabs) =====
let currentSettingsTab = 'business';
function renderSettings() {
  return `
    <div class="settings-tabs">
      <button class="settings-tab ${currentSettingsTab==='business'?'active':''}" data-stab="business">🏢 Thông tin doanh nghiệp</button>
      <button class="settings-tab ${currentSettingsTab==='ai'?'active':''}" data-stab="ai">${ICON.brain} Cấu hình AI Agent</button>
      <button class="settings-tab ${currentSettingsTab==='platforms'?'active':''}" data-stab="platforms">🔗 Kết nối sàn</button>
      <button class="settings-tab ${currentSettingsTab==='team'?'active':''}" data-stab="team">👥 Phân quyền & Bảo mật</button>
    </div>
    <div id="settingsTabContent">${renderSettingsTab()}</div>
  `;
}

function renderSettingsTab() {
  if (currentSettingsTab === 'business') {
    return `
      <div class="content-card">
        <div class="content-card-title">Hồ sơ doanh nghiệp</div>
        <div style="display:flex;gap:24px;align-items:flex-start;margin-bottom:20px;">
          <div class="logo-upload">
            <div class="logo-upload-circle" style="width:80px;height:80px;border-radius:50%;background:var(--gradient-primary);display:flex;align-items:center;justify-content:center;font-size:1.8rem;font-weight:800;color:#451a03;">SP</div>
            <button class="btn-modal-cancel" style="margin-top:8px;">Đổi logo</button>
          </div>
          <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div class="settings-field"><label class="settings-label">Tên shop</label><input class="settings-input" value="Shop PhoneMax"></div>
            <div class="settings-field"><label class="settings-label">Mã số thuế</label><input class="settings-input" value="0301234567"></div>
            <div class="settings-field" style="grid-column:1/-1;"><label class="settings-label">Địa chỉ kho hàng</label><input class="settings-input" value="123 Nguyễn Trãi, Q.1, TP.HCM"></div>
            <div class="settings-field"><label class="settings-label">Ngành hàng chính</label>
              <select class="settings-input"><option>Điện tử & Phụ kiện</option><option>Thời trang</option><option>Mỹ phẩm</option><option>Gia dụng</option></select>
            </div>
            <div class="settings-field"><label class="settings-label">Số nhân viên vận hành</label><input class="settings-input" type="number" value="3"></div>
            <div class="settings-field"><label class="settings-label">Số SKU đang bán</label><input class="settings-input" type="number" value="234"></div>
            <div class="settings-field"><label class="settings-label">Mục tiêu doanh thu tháng (VNĐ)</label><input class="settings-input" type="number" value="3200000000"></div>
          </div>
        </div>
        <button class="btn-approve">💾 Lưu thay đổi</button>
      </div>
    `;
  }
  if (currentSettingsTab === 'ai') {
    return `
      <div class="content-card">
        <div class="content-card-title">Dữ liệu định hướng cho AI Agent</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <div class="settings-field" style="grid-column:1/-1;"><label class="settings-label">Khách hàng mục tiêu</label><textarea class="settings-input" rows="2">Học sinh sinh viên, nhân viên văn phòng yêu công nghệ, thu nhập 8-25 triệu/tháng</textarea></div>
          <div class="settings-field" style="grid-column:1/-1;"><label class="settings-label">Định hướng chiến lược</label><textarea class="settings-input" rows="3">Ưu tiên đi đầu về giá ở nhóm tai nghe. Giữ biên lợi nhuận cao ở nhóm phụ kiện ốp lưng. Không bao giờ phá giá iPhone dòng mới.</textarea></div>
          <div class="settings-field"><label class="settings-label">Ngưỡng biên LN tối thiểu (%)</label><input class="settings-input" type="number" value="8"><small style="color:var(--text-muted);font-size:0.75rem;">AI sẽ KHÔNG đề xuất giảm giá xuống dưới ngưỡng này</small></div>
          <div class="settings-field"><label class="settings-label">Ngưỡng ROAS tối thiểu</label><input class="settings-input" type="number" step="0.1" value="3.0"><small style="color:var(--text-muted);font-size:0.75rem;">Campaign dưới ngưỡng → AI tự động cắt</small></div>
          <div class="settings-field"><label class="settings-label">Tone Chatbot</label>
            <select class="settings-input"><option>Lịch sự, nhiệt tình, sử dụng nhiều emoji thân thiện</option><option>Chuyên nghiệp, ngắn gọn</option><option>Gen Z, vui vẻ</option></select>
          </div>
          <div class="settings-field"><label class="settings-label">Ngôn ngữ phản hồi</label>
            <select class="settings-input"><option>Tiếng Việt</option><option>Song ngữ Việt-Anh</option></select>
          </div>
          <div class="settings-field" style="grid-column:1/-1;"><label class="settings-label">Từ khóa cấm trong phản hồi (cách nhau bởi dấu phẩy)</label><input class="settings-input" value="MobileWorld, TechZone, Hoàng Hà, hàng giả, lừa đảo"></div>
        </div>
        <button class="btn-approve" style="margin-top:14px;">💾 Lưu cấu hình AI</button>
      </div>
    `;
  }
  if (currentSettingsTab === 'platforms') {
    return `
      <div class="platform-grid">
        ${MOCK.platforms.map(p => `
          <div class="platform-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <div style="display:flex;gap:10px;align-items:center;">
                <div style="width:40px;height:40px;border-radius:8px;background:${p.color}22;color:${p.color};display:flex;align-items:center;justify-content:center;font-weight:800;">${p.name[0]}</div>
                <strong>${p.name}</strong>
              </div>
              <span class="status-badge" style="background:${p.connected?'var(--accent-emerald-bg)':'var(--accent-amber-bg)'};color:${p.connected?'var(--accent-emerald)':'var(--accent-amber)'};">${p.connected?'Đã kết nối':'Chưa kết nối'}</span>
            </div>
            ${p.connected ? `
              <div class="platform-details" style="font-size:0.8rem;color:var(--text-muted);line-height:1.8;">
                <div>📅 Ngày kết nối: ${p.connected_date}</div>
                <div>📦 SKU đang sync: <strong>${p.sku_synced}</strong></div>
                <div>💰 Doanh thu tháng: <strong>${fmt.currency(p.revenue)}đ</strong></div>
              </div>
              <button class="btn-platform-disconnect" style="margin-top:10px;width:100%;">Ngắt kết nối</button>
            ` : `
              <div class="connect-steps" style="font-size:0.8rem;line-height:1.8;">
                <div class="connect-step"><span class="connect-step-num">1</span> Đăng nhập ${p.name} Seller Center</div>
                <div class="connect-step"><span class="connect-step-num">2</span> Vào Cài đặt → API → Tạo API Key</div>
                <div class="connect-step"><span class="connect-step-num">3</span> Dán API Key vào Agicom</div>
              </div>
              <button class="btn-approve" style="margin-top:10px;width:100%;">+ Kết nối ngay</button>
            `}
          </div>
        `).join('')}
      </div>
    `;
  }
  if (currentSettingsTab === 'team') {
    return `
      <div class="content-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div class="content-card-title" style="margin:0;">👥 Thành viên (${MOCK.team_members.length})</div>
          <button class="btn-approve">+ Mời thành viên</button>
        </div>
        <table class="data-table" style="width:100%;font-size:0.85rem;">
          <thead><tr><th>Tên</th><th>Email</th><th>Vai trò</th><th></th></tr></thead>
          <tbody>
            ${MOCK.team_members.map(m => `<tr>
              <td><strong>${m.name}</strong></td>
              <td>${m.email}</td>
              <td><span class="table-badge" style="background:${m.role==='Admin'?'var(--accent-rose-bg)':m.role==='Vận hành'?'var(--accent-amber-bg)':'var(--bg-glass)'};color:${m.role==='Admin'?'var(--accent-rose)':m.role==='Vận hành'?'var(--accent-amber)':'var(--text-muted)'};">${m.role}</span></td>
              <td><button class="btn-modal-cancel">Sửa</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <div class="content-card" style="margin-top:16px;">
        <div class="content-card-title">📜 Lịch sử hoạt động AI 7 ngày gần nhất</div>
        <div class="activity-timeline">
          ${MOCK.recent_activity.map(a => {
            const sColor = a.status==='approved'?'var(--accent-emerald)':a.status==='rejected'?'var(--accent-rose)':'var(--accent-amber)';
            return `<div class="activity-item">
              <div class="activity-dot" style="background:${sColor};"></div>
              <div style="flex:1;">
                <div style="font-weight:600;font-size:0.85rem;">${a.action}</div>
                <div class="activity-time">${a.user} · ${a.time} trước</div>
              </div>
              <span class="status-badge" style="background:${sColor}22;color:${sColor};">${a.status==='approved'?'Duyệt':a.status==='rejected'?'Từ chối':'Chờ duyệt'}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  }
}

// ===== AI Performance Page =====
function renderAIPerformance() {
  const p = MOCK.ai_perf;
  return `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-card-label">Tổng đề xuất đã thực thi (30 ngày)</div><div class="stat-card-value">${p.total_executed}</div></div>
      <div class="stat-card"><div class="stat-card-label">Tỷ lệ đề xuất được duyệt</div><div class="stat-card-value" style="color:var(--accent-emerald);">${p.approval_rate}%</div></div>
      <div class="stat-card"><div class="stat-card-label">Doanh thu tăng nhờ AI</div><div class="stat-card-value" style="color:var(--accent-amber);">+${fmt.currency(p.revenue_added)}đ</div></div>
      <div class="stat-card"><div class="stat-card-label">Thời gian phản hồi CSKH</div><div class="stat-card-value">${p.response_time_after}s</div><small style="color:var(--accent-emerald);">↓ từ ${p.response_time_before}s trước AI</small></div>
    </div>

    <div class="content-card" style="margin-top:20px;">
      <div class="content-card-title">📊 Hiệu suất theo loại Agent</div>
      <table class="data-table" style="width:100%;font-size:0.85rem;">
        <thead><tr><th>Agent</th><th style="text-align:right;">Số đề xuất</th><th style="text-align:right;">Tỷ lệ duyệt</th><th>Kết quả</th><th>Trend</th></tr></thead>
        <tbody>
          ${MOCK.ai_perf_by_agent.map(a => `<tr>
            <td><strong>${a.icon} ${a.name}</strong></td>
            <td style="text-align:right;">${a.total}</td>
            <td style="text-align:right;color:${a.approved>=80?'var(--accent-emerald)':a.approved>=70?'var(--accent-amber)':'var(--accent-rose)'};font-weight:700;">${a.approved}%</td>
            <td>${a.result}</td>
            <td>${a.trend==='up'?'<span style="color:var(--accent-emerald);">↑ Cải thiện</span>':'<span style="color:var(--text-muted);">→ Ổn định</span>'}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="content-card" style="margin-top:20px;">
      <div class="content-card-title">📈 Biểu đồ học hỏi theo thời gian (Tỷ lệ duyệt theo tuần)</div>
      <div class="bar-chart" style="display:flex;gap:12px;align-items:flex-end;height:200px;padding:20px 8px 8px;">
        ${[58, 64, 69, 73, 76, 81, 84].map((v, i) => `
          <div class="bar-col" style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end;">
            <div class="bar-value" style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px;font-weight:700;">${v}%</div>
            <div class="bar-fill" style="width:100%;height:${v}%;background:linear-gradient(180deg,#10b981 0%,#34d399 100%);border-radius:6px 6px 0 0;"></div>
            <div class="bar-label" style="font-size:0.7rem;color:var(--text-muted);margin-top:6px;">T${i+1}</div>
          </div>
        `).join('')}
      </div>
      <div style="margin-top:14px;padding:12px;background:var(--accent-emerald-bg);border-radius:8px;font-size:0.85rem;">
        ${ICON.brain} <strong>AI đã học từ 142 quyết định.</strong> Độ chính xác đề xuất tăng <strong>+26%</strong> so với tháng trước. Bước "Learn" trong vòng lặp Observe→Think→Plan→Act→Learn đang vận hành hiệu quả.
      </div>
    </div>
  `;
}

/* =====================================================================
   5. ROUTER
   ===================================================================== */

// ===== Stub pages for new routes =====
function stubPage(title, icon, desc, comingSoon) {
  const items = comingSoon.map(f =>
    '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-primary);">'
    + '<div style="width:8px;height:8px;border-radius:50%;background:var(--accent-amber);flex-shrink:0;"></div>'
    + '<div style="font-size:0.88rem;color:var(--text-secondary);">' + f + '</div>'
    + '<span style="margin-left:auto;font-size:0.7rem;background:var(--accent-amber-bg);color:var(--accent-amber);padding:2px 8px;border-radius:10px;font-weight:700;">Sắp ra mắt</span>'
    + '</div>'
  ).join('');
  return '<div class="content-card" style="max-width:600px;margin:40px auto;text-align:center;padding:40px 32px;">'
    + '<div style="font-size:3rem;margin-bottom:16px;">' + icon + '</div>'
    + '<div style="font-size:1.3rem;font-weight:800;color:var(--text-heading);margin-bottom:8px;">' + title + '</div>'
    + '<div style="color:var(--text-muted);font-size:0.9rem;margin-bottom:24px;">' + desc + '</div>'
    + '<div style="text-align:left;border-top:1px solid var(--border-primary);padding-top:16px;">' + items + '</div>'
    + '</div>';
}

function renderMarketOverview() {
  const trends = MOCK.market_trends;
  const gaps = MOCK.competitor_gaps;
  const totalChatSignals = trends.reduce((s,t) => s + t.chatbot_count, 0);
  const totalReviewSignals = trends.reduce((s,t) => s + t.review_count, 0);
  const highPrioOpps = trends.filter(t => t.sentiment_pct.negative > 40 || t.trend_pct > 20).length;

  function sentBar(neg, neu, pos) {
    return '<div style="display:flex;border-radius:4px;overflow:hidden;height:8px;width:100%;margin-top:6px;">'
      + '<div style="width:' + pos + '%;background:#10b981;" title="Tích cực"></div>'
      + '<div style="width:' + neu + '%;background:#94a3b8;" title="Trung tính"></div>'
      + '<div style="width:' + neg + '%;background:#ef4444;" title="Tiêu cực"></div>'
      + '</div>'
      + '<div style="display:flex;gap:10px;margin-top:4px;">'
      + '<span style="font-size:0.68rem;color:#10b981;">✓ Tích cực ' + pos + '%</span>'
      + '<span style="font-size:0.68rem;color:#94a3b8;">Trung tính ' + neu + '%</span>'
      + '<span style="font-size:0.68rem;color:#ef4444;">Lo ngại ' + neg + '%</span>'
      + '</div>';
  }

  function trendIcon(dir, pct) {
    if (dir === 'up') return '<span style="color:#ef4444;font-size:0.75rem;font-weight:700;">▲ +' + pct + '% tuần này</span>';
    return '<span style="color:#94a3b8;font-size:0.75rem;">→ Ổn định</span>';
  }

  function priorityBadge(t) {
    const score = t.chatbot_count + t.review_count;
    if (score > 50 || t.sentiment_pct.negative > 50) return '<span style="background:#fef2f2;color:#ef4444;font-size:0.68rem;font-weight:700;padding:2px 8px;border-radius:10px;">🔴 ƯU TIÊN CAO</span>';
    if (score > 25 || t.trend_pct > 20) return '<span style="background:#fffbeb;color:#f59e0b;font-size:0.68rem;font-weight:700;padding:2px 8px;border-radius:10px;">🟡 TRUNG BÌNH</span>';
    return '<span style="background:#f0fdf4;color:#10b981;font-size:0.68rem;font-weight:700;padding:2px 8px;border-radius:10px;">🟢 THEO DÕI</span>';
  }

  // Build opportunities from trends (intersecting chatbot + review)
  const opportunities = trends
    .filter(t => t.chatbot_count > 5)
    .sort((a,b) => (b.chatbot_count + b.review_count) - (a.chatbot_count + a.review_count))
    .slice(0, 3);

  const oppCards = [
    {
      title: 'Tạo video "Test pin S24 Ultra — 72 giờ thực tế"',
      signal1: { label: '23 câu hỏi chatbot', detail: '"Pin dùng được mấy tiếng?" — câu hỏi #1 trong 7 ngày', color: '#6366f1', icon: '💬' },
      signal2: { label: '23 reviews lo ngại pin', detail: '74% review tiêu cực về pin khi zoom camera', color: '#10b981', icon: '⭐' },
      action: 'Quay video TikTok + blog test thực tế 72h',
      score: 94, impact: 'CR tăng dự kiến +8-12%'
    },
    {
      title: 'Tạo trang giá sỉ B2B chính thức',
      signal1: { label: '12 câu hỏi chatbot', detail: '"Lấy 5 cái có giảm không?" — xu hướng tăng 45%', color: '#6366f1', icon: '💬' },
      signal2: { label: 'Đối thủ Hoàng Hà đã có', detail: 'Khách tham khảo Hoàng Hà vì họ có bảng giá sỉ công khai', color: '#f59e0b', icon: '⚡' },
      action: 'Tạo landing page giá sỉ + form liên hệ đại lý',
      score: 78, impact: 'Mở kênh B2B +5-8 đơn/tháng'
    },
    {
      title: 'Video unbox kiểm tra tem auth chính hãng',
      signal1: { label: '17 câu hỏi chatbot', detail: '"Hàng có auth không?" — lo ngại phổ biến nhất', color: '#6366f1', icon: '💬' },
      signal2: { label: '12 reviews tích cực', detail: 'Khách đã mua đánh giá cao hàng auth — nên amplify', color: '#10b981', icon: '⭐' },
      action: 'Video unbox live + thêm ảnh tem vào listing',
      score: 71, impact: 'Tăng trust score, giảm 45% câu hỏi'
    }
  ];

  let html = '<div class="content-card" style="margin-bottom:20px;">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">'
    + '<div><div class="content-card-title" style="margin-bottom:4px;">🏪 Tổng quan ngành hàng — Phân tích đa nguồn</div>'
    + '<div style="font-size:0.8rem;color:var(--text-muted);">AI tổng hợp từ ' + totalChatSignals + ' tín hiệu chatbot + ' + totalReviewSignals + ' tín hiệu review → phát hiện ' + highPrioOpps + ' cơ hội ưu tiên cao</div>'
    + '</div>'
    + '<div style="display:flex;gap:12px;">'
    + '<div style="text-align:center;padding:10px 16px;background:var(--bg-secondary);border-radius:8px;"><div style="font-size:1.4rem;font-weight:800;color:var(--accent-indigo);">' + totalChatSignals + '</div><div style="font-size:0.7rem;color:var(--text-muted);">Tín hiệu Chatbot</div></div>'
    + '<div style="text-align:center;padding:10px 16px;background:var(--bg-secondary);border-radius:8px;"><div style="font-size:1.4rem;font-weight:800;color:var(--accent-emerald);">' + totalReviewSignals + '</div><div style="font-size:0.7rem;color:var(--text-muted);">Tín hiệu Review</div></div>'
    + '<div style="text-align:center;padding:10px 16px;background:var(--bg-secondary);border-radius:8px;"><div style="font-size:1.4rem;font-weight:800;color:var(--accent-amber);">' + highPrioOpps + '</div><div style="font-size:0.7rem;color:var(--text-muted);">Cơ hội ưu tiên cao</div></div>'
    + '</div></div></div>';

  // ---- SECTION 1: Industry Trend Cards ----
  html += '<div style="margin-bottom:8px;font-size:0.82rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;">📈 Xu hướng ngành hàng — Top 5 chủ đề nóng</div>';
  html += '<div class="grid-2" style="gap:16px;margin-bottom:24px;">';
  trends.forEach(function(t, i) {
    html += '<div style="background:var(--bg-primary);border:1px solid var(--border-primary);border-radius:12px;padding:16px;position:relative;">';
    html += '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;">';
    html += '<div><div style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin-bottom:4px;">' + t.topic + '</div>';
    html += trendIcon(t.trend_direction, t.trend_pct) + '</div>';
    html += priorityBadge(t) + '</div>';
    html += '<div style="display:flex;gap:12px;margin-bottom:10px;">';
    html += '<div style="flex:1;background:#eef2ff;border-radius:8px;padding:8px;text-align:center;">';
    html += '<div style="font-size:1.1rem;font-weight:800;color:#6366f1;">' + t.chatbot_count + '</div>';
    html += '<div style="font-size:0.68rem;color:#6366f1;">💬 Chatbot</div></div>';
    html += '<div style="flex:1;background:#f0fdf4;border-radius:8px;padding:8px;text-align:center;">';
    html += '<div style="font-size:1.1rem;font-weight:800;color:#10b981;">' + t.review_count + '</div>';
    html += '<div style="font-size:0.68rem;color:#10b981;">⭐ Review</div></div>';
    html += '<div style="flex:1;background:var(--bg-secondary);border-radius:8px;padding:8px;text-align:center;">';
    html += '<div style="font-size:1.1rem;font-weight:800;color:var(--text-primary);">' + (t.chatbot_count + t.review_count) + '</div>';
    html += '<div style="font-size:0.68rem;color:var(--text-muted);">Tổng tín hiệu</div></div>';
    html += '</div>';
    html += '<div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px;">Cảm xúc khách hàng:</div>';
    html += sentBar(t.sentiment_pct.negative, t.sentiment_pct.neutral, t.sentiment_pct.positive);
    if (t.competitor_note) {
      html += '<div style="margin-top:10px;padding:8px;background:#fffbeb;border-radius:6px;border-left:3px solid #f59e0b;font-size:0.75rem;color:#92400e;">⚡ ' + t.competitor_note + '</div>';
    }
    html += '<div style="margin-top:10px;padding:8px;background:#f8fafc;border-radius:6px;font-size:0.75rem;color:var(--text-secondary);">💡 ' + t.opportunity + '</div>';
    html += '</div>';
  });
  html += '</div>';

  // ---- SECTION 2: Competitor Gap Analysis ----
  html += '<div class="content-card" style="margin-bottom:20px;">';
  html += '<div class="content-card-title">⚡ Gap Analysis — Những gì đối thủ có mà mình chưa có</div>';
  html += '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:16px;">Phát hiện từ so sánh câu hỏi chatbot với năng lực hiện tại của đối thủ</div>';
  gaps.forEach(function(g, i) {
    const typeColor = g.gap_type === 'content' ? '#6366f1' : g.gap_type === 'business' ? '#f59e0b' : '#10b981';
    const typeBg = g.gap_type === 'content' ? '#eef2ff' : g.gap_type === 'business' ? '#fffbeb' : '#f0fdf4';
    const typeLabel = g.gap_type === 'content' ? 'Content' : g.gap_type === 'business' ? 'Kinh doanh' : 'Chính sách';
    html += '<div style="display:flex;align-items:center;gap:14px;padding:14px 0;' + (i < gaps.length-1 ? 'border-bottom:1px solid var(--border-primary);' : '') + '">';
    html += '<div style="width:40px;height:40px;border-radius:10px;background:' + typeBg + ';display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">' + (g.gap_type === 'content' ? '📹' : g.gap_type === 'business' ? '💼' : '📋') + '</div>';
    html += '<div style="flex:1;">';
    html += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;"><strong style="font-size:0.88rem;">' + g.feature + '</strong>';
    html += '<span style="background:' + typeBg + ';color:' + typeColor + ';font-size:0.68rem;font-weight:700;padding:2px 6px;border-radius:4px;">' + typeLabel + '</span></div>';
    html += '<div style="font-size:0.77rem;color:var(--text-muted);margin-top:2px;">Đối thủ: <strong>' + g.competitor + '</strong></div>';
    html += '<div style="font-size:0.77rem;color:var(--text-secondary);margin-top:2px;">Impact: ' + g.impact + '</div>';
    html += '</div>';
    html += '<div style="text-align:right;flex-shrink:0;">';
    html += '<div style="font-size:1.1rem;font-weight:800;color:#ef4444;">' + g.chatbot_count + '</div>';
    html += '<div style="font-size:0.68rem;color:var(--text-muted);">khách hỏi</div>';
    html += '</div></div>';
  });
  html += '</div>';

  // ---- SECTION 3: Market Opportunities Board ----
  html += '<div class="content-card" style="margin-bottom:20px;">';
  html += '<div class="content-card-title">🎯 Cơ hội thị trường — Đề xuất hành động ưu tiên</div>';
  html += '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:16px;">Mỗi cơ hội được tổng hợp từ <strong>2 nguồn dữ liệu độc lập</strong> — chatbot + review — để đảm bảo độ tin cậy cao</div>';
  oppCards.forEach(function(opp, i) {
    const scoreColor = opp.score > 85 ? '#ef4444' : opp.score > 70 ? '#f59e0b' : '#10b981';
    const scoreBg = opp.score > 85 ? '#fef2f2' : opp.score > 70 ? '#fffbeb' : '#f0fdf4';
    html += '<div style="border:1px solid var(--border-primary);border-radius:12px;padding:16px;margin-bottom:12px;position:relative;">';
    html += '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;">';
    html += '<div style="flex:1;min-width:200px;">';
    html += '<div style="font-size:0.92rem;font-weight:700;color:var(--text-primary);margin-bottom:10px;">' + opp.title + '</div>';
    // Two signals side by side
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">';
    [opp.signal1, opp.signal2].forEach(function(sig) {
      html += '<div style="background:var(--bg-secondary);border-radius:8px;padding:10px;border-left:3px solid ' + sig.color + ';">';
      html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">';
      html += '<span style="font-size:0.9rem;">' + sig.icon + '</span>';
      html += '<strong style="font-size:0.78rem;color:' + sig.color + ';">' + sig.label + '</strong></div>';
      html += '<div style="font-size:0.73rem;color:var(--text-muted);">' + sig.detail + '</div>';
      html += '</div>';
    });
    html += '</div>';
    html += '<div style="background:#f0fdf4;border-radius:8px;padding:10px;display:flex;align-items:center;gap:8px;">';
    html += '<span style="font-size:0.9rem;">🚀</span>';
    html += '<div><div style="font-size:0.75rem;font-weight:700;color:#10b981;">Hành động đề xuất</div>';
    html += '<div style="font-size:0.78rem;color:#065f46;">' + opp.action + '</div></div>';
    html += '</div></div>';
    // Score + Impact
    html += '<div style="text-align:center;flex-shrink:0;">';
    html += '<div style="width:64px;height:64px;border-radius:50%;background:' + scoreBg + ';border:3px solid ' + scoreColor + ';display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto 8px;">';
    html += '<div style="font-size:1.1rem;font-weight:800;color:' + scoreColor + ';line-height:1;">' + opp.score + '</div>';
    html += '<div style="font-size:0.6rem;color:' + scoreColor + ';">score</div>';
    html += '</div>';
    html += '<div style="font-size:0.68rem;color:var(--text-muted);max-width:100px;">' + opp.impact + '</div>';
    html += '</div></div></div>';
  });
  html += '</div>';

  return html;
}

function renderChatSentiment() {
  return '<div class="content-card" style="margin-bottom:20px;">'
    + '<div class="content-card-title">😊 Sentiment Analysis — Chatbot (7 ngày qua)</div>'
    + '<div class="grid-2" style="gap:20px;margin-top:16px;">'
    + '<div>'
    + '<div style="font-size:0.85rem;font-weight:700;margin-bottom:12px;color:var(--text-muted);">Phân bổ cảm xúc theo ngày</div>'
    + '<div class="bar-chart" style="display:flex;gap:10px;align-items:flex-end;height:160px;padding:16px 0 0;">'
    + ['T2','T3','T4','T5','T6','T7','CN'].map((d,i) => {
        // can't use template literals inside string concat in Python PYEOF - handled differently
        return ''; // placeholder
      }).join('')
    + '</div></div>'
    + '<div>'
    + '<div style="font-size:0.85rem;font-weight:700;margin-bottom:12px;color:var(--text-muted);">Top từ khoá cảm xúc</div>'
    + ['tuyệt vời (89)','nhanh (67)','chất lượng (54)','lỗi (23)','chậm (18)','hỏng (12)'].map((w,i) =>
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'
        + '<span style="font-size:0.8rem;flex:1;">' + w + '</span>'
        + '<div style="width:' + (i<3?'60':'25') + '%;height:6px;background:' + (i<3?'#10b981':'#ef4444') + ';border-radius:3px;"></div>'
        + '</div>'
      ).join('')
    + '</div></div>'
    + '</div>'
    + renderReviews();
}
function renderChatReport() {
  const insights = MOCK.insights;
  return '<div class="content-card" style="margin-bottom:20px;">'
    + '<div class="content-card-title">📊 Báo cáo thắc mắc & vấn đề thường gặp — AI tổng hợp từ chat</div>'
    + insights.map(i =>
        '<div class="alert-item">'
        + '<div class="alert-icon">' + i.icon + '</div>'
        + '<div class="alert-content"><div class="alert-text"><strong>' + i.title + '</strong></div>'
        + '<div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px;">' + i.detail + '</div></div>'
        + (i.cta ? '<button class="alert-cta">' + i.cta + ' →</button>' : '')
        + '</div>'
      ).join('')
    + '</div>';
}
function renderChatInsights() {
  return '<div class="content-card" style="margin-bottom:20px;">'
    + '<div class="content-card-title">' + ICON.brain + ' Tổng hợp vấn đề từ Chatbot — Pattern Detection</div>'
    + '<div style="font-size:0.82rem;color:var(--text-muted);margin-bottom:16px;">AI phân tích ' + MOCK.ai_today.chats_handled + ' cuộc hội thoại trong 7 ngày, phát hiện các pattern quan trọng:</div>'
    + MOCK.chat_clusters.map((cl,i) =>
        '<div style="display:flex;align-items:center;gap:14px;padding:12px 0;' + (i<MOCK.chat_clusters.length-1?'border-bottom:1px solid var(--border-primary);':'') + '">'
        + '<div style="font-size:1.2rem;">' + cl.icon + '</div>'
        + '<div style="flex:1;">'
        +   '<div style="display:flex;align-items:center;gap:8px;"><strong style="font-size:0.88rem;">' + cl.label + '</strong>'
        +   '<span style="background:' + (cl.urgent?'var(--accent-rose-bg)':'var(--accent-amber-bg)') + ';color:' + (cl.urgent?'var(--accent-rose)':'var(--accent-amber)') + ';font-size:0.68rem;font-weight:700;padding:2px 6px;border-radius:4px;">' + cl.count + ' khách</span></div>'
        +   '<div style="font-size:0.78rem;color:var(--text-muted);">Impact: ' + cl.impact + '</div>'
        + '</div>'
        + '<div style="text-align:right;">'
        +   '<div style="font-size:0.75rem;color:var(--accent-indigo);font-weight:600;margin-bottom:4px;">→ ' + cl.action + '</div>'
        +   '<button class="alert-cta">Xử lý ngay</button>'
        + '</div></div>'
      ).join('')
    + '</div>';
}
function renderContentSuggestions() {
  const sugs = MOCK.content_suggestions_generated;
  const pending = sugs.filter(s => s.status === 'pending');
  const saved = sugs.filter(s => s.status === 'saved');
  const clusters = MOCK.chat_clusters;
  const inv = MOCK.content_inventory;

  const typeLabel = { video: '🎬 Video', blog_faq: '📝 Blog/FAQ', comparison: '⚖️ So sánh', guide: '📋 Hướng dẫn' };
  const typeColor = { video: '#6366f1', blog_faq: '#10b981', comparison: '#f59e0b', guide: '#0ea5e9' };
  const typeBg = { video: '#eef2ff', blog_faq: '#f0fdf4', comparison: '#fffbeb', guide: '#f0f9ff' };

  function scoreRing(score) {
    const c = score > 85 ? '#ef4444' : score > 70 ? '#f59e0b' : '#10b981';
    const bg = score > 85 ? '#fef2f2' : score > 70 ? '#fffbeb' : '#f0fdf4';
    return '<div style="width:56px;height:56px;border-radius:50%;background:' + bg + ';border:3px solid ' + c + ';display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;">'
      + '<div style="font-size:1rem;font-weight:800;color:' + c + ';line-height:1;">' + score + '</div>'
      + '<div style="font-size:0.58rem;color:' + c + ';">score</div></div>';
  }

  const scheduled = sugs.filter(function(s) { return s.status === 'scheduled'; });
  const ignored   = sugs.filter(function(s) { return s.status === 'ignored'; });
  const visible   = sugs.filter(function(s) { return s.status !== 'ignored'; });

  // ---- SUMMARY HEADER ----
  let html = '<div class="content-card" style="margin-bottom:20px;">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">'
    + '<div><div class="content-card-title" style="margin-bottom:4px;">✍️ Đề xuất Content — AI phân tích đa nguồn</div>'
    + '<div style="font-size:0.8rem;color:var(--text-muted);">Phân tích ' + clusters.reduce(function(s,c){return s+c.count;},0) + ' câu hỏi chatbot + ' + MOCK.reviews.length + ' reviews → ' + pending.length + ' nội dung cần tạo gấp</div>'
    + '</div>'
    + '<div style="display:flex;gap:10px;flex-wrap:wrap;">'
    + '<div style="text-align:center;padding:10px 14px;background:#fef2f2;border-radius:8px;"><div style="font-size:1.4rem;font-weight:800;color:#ef4444;">' + pending.length + '</div><div style="font-size:0.68rem;color:#ef4444;">Chờ tạo</div></div>'
    + '<div style="text-align:center;padding:10px 14px;background:#fffbeb;border-radius:8px;"><div style="font-size:1.4rem;font-weight:800;color:#f59e0b;">' + saved.length + '</div><div style="font-size:0.68rem;color:#f59e0b;">Đã lưu</div></div>'
    + '<div style="text-align:center;padding:10px 14px;background:#f0fdf4;border-radius:8px;"><div style="font-size:1.4rem;font-weight:800;color:#10b981;">' + scheduled.length + '</div><div style="font-size:0.68rem;color:#10b981;">Đã lên lịch</div></div>'
    + '<div style="text-align:center;padding:10px 14px;background:#f0f9ff;border-radius:8px;"><div style="font-size:1.4rem;font-weight:800;color:#0ea5e9;">' + inv.length + '</div><div style="font-size:0.68rem;color:#0ea5e9;">Đã xuất bản</div></div>'
    + '</div></div></div>';

  // ---- SECTION 1: Content Gap Analyzer ----
  html += '<div class="content-card" style="margin-bottom:20px;">';
  html += '<div class="content-card-title">🔍 Phân tích khoảng trống Content</div>';
  html += '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:16px;">So sánh câu hỏi thực tế của khách với kho content hiện có — tìm "lỗ hổng" cần lấp đầy</div>';
  html += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:0.82rem;">';
  html += '<thead><tr style="border-bottom:2px solid var(--border-primary);">'
    + '<th style="text-align:left;padding:8px 12px;font-weight:700;color:var(--text-muted);">Chủ đề khách hỏi</th>'
    + '<th style="text-align:center;padding:8px;font-weight:700;color:#6366f1;">💬 Chatbot</th>'
    + '<th style="text-align:center;padding:8px;font-weight:700;color:#10b981;">⭐ Review</th>'
    + '<th style="text-align:center;padding:8px;font-weight:700;color:var(--text-muted);">Cảm xúc</th>'
    + '<th style="text-align:left;padding:8px 12px;font-weight:700;color:var(--text-muted);">Content hiện có?</th>'
    + '<th style="text-align:center;padding:8px;font-weight:700;color:var(--text-muted);">Hành động</th>'
    + '</tr></thead><tbody>';

  // Xây gap analysis từ MOCK.chat_clusters + reviews + inventory (động)
  var gapData = (MOCK.chat_clusters || []).map(function(cl) {
    var kw0 = cl.label.toLowerCase().split(' ')[0];
    var negRevs = (MOCK.reviews || []).filter(function(r) {
      return r.rating <= 3 && ((r.text || '').toLowerCase().includes(kw0) ||
        (r.product_id || '').toLowerCase().includes(kw0));
    });
    var matchedInv = inv.find(function(c) {
      return c.topic && c.topic.toLowerCase().split('/').some(function(t) {
        return cl.label.toLowerCase().includes(t.trim()) || t.trim().includes(kw0);
      });
    });
    return {
      topic: cl.label,
      chatbot: cl.count,
      review: negRevs.length > 0 ? negRevs.length * 3 : 0,
      neg: negRevs.length > 0 ? Math.min(95, 40 + negRevs.length * 15) : (cl.urgent ? 35 : 8),
      has_content: !!matchedInv,
      content_type: matchedInv ? ((matchedInv.type === 'video' ? 'Video' : 'Blog') + ' (' + (matchedInv.published || '') + ')') : null,
      questions_reduced: matchedInv ? matchedInv.questions_reduced : null,
      content_gap: 'Cần: ' + (cl.action || 'tạo content')
    };
  });

  gapData.forEach(function(row) {
    var sentColor = row.neg > 50 ? '#ef4444' : row.neg > 20 ? '#f59e0b' : '#10b981';
    // Tìm suggestion khớp để liên kết nút "Tạo ngay"
    var kw = row.topic.toLowerCase().split(' ')[0];
    var matchSug = (MOCK.content_suggestions_generated || []).find(function(s) {
      return s.status !== 'ignored' && (s.title || '').toLowerCase().includes(kw);
    });
    html += '<tr style="border-bottom:1px solid var(--border-primary);">';
    html += '<td style="padding:10px 12px;font-weight:600;">' + row.topic + '</td>';
    html += '<td style="text-align:center;padding:10px;"><span style="background:#eef2ff;color:#6366f1;font-weight:700;padding:3px 8px;border-radius:6px;">' + row.chatbot + '</span></td>';
    html += '<td style="text-align:center;padding:10px;"><span style="background:#f0fdf4;color:#10b981;font-weight:700;padding:3px 8px;border-radius:6px;">' + row.review + '</span></td>';
    html += '<td style="text-align:center;padding:10px;"><span style="color:' + sentColor + ';font-size:0.75rem;font-weight:700;">' + row.neg + '% lo ngại</span></td>';
    if (row.has_content) {
      html += '<td style="padding:10px 12px;"><span style="background:#f0fdf4;color:#10b981;font-size:0.72rem;font-weight:700;padding:3px 8px;border-radius:6px;">✅ ' + row.content_type + '</span><div style="font-size:0.68rem;color:var(--text-muted);margin-top:2px;">Giảm ' + row.questions_reduced + '% câu hỏi</div></td>';
      html += '<td style="text-align:center;padding:10px;"><span style="font-size:0.72rem;color:#10b981;">✅ Đang hoạt động</span></td>';
    } else if (matchSug && matchSug.status === 'scheduled') {
      html += '<td style="padding:10px 12px;"><span style="background:#fef2f2;color:#ef4444;font-size:0.72rem;font-weight:700;padding:3px 8px;border-radius:6px;">❌ Thiếu</span><div style="font-size:0.68rem;color:var(--text-muted);margin-top:2px;">' + row.content_gap + '</div></td>';
      html += '<td style="text-align:center;padding:10px;"><span style="font-size:0.72rem;color:#10b981;font-weight:700;">🗓 Đã lên lịch</span></td>';
    } else {
      var onclickFn = matchSug
        ? 'scheduleSuggestion(\'' + matchSug.id.replace(/'/g,"\\'") + '\')'
        : 'showToast(\'Tạo đề xuất AI trước để lên lịch\', \'info\')';
      html += '<td style="padding:10px 12px;"><span style="background:#fef2f2;color:#ef4444;font-size:0.72rem;font-weight:700;padding:3px 8px;border-radius:6px;">❌ Thiếu</span><div style="font-size:0.68rem;color:var(--text-muted);margin-top:2px;">' + row.content_gap + '</div></td>';
      html += '<td style="text-align:center;padding:10px;"><button class="alert-cta" onclick="' + onclickFn + '">Lên lịch</button></td>';
    }
    html += '</tr>';
  });
  html += '</tbody></table></div></div>';

  // ---- SECTION 2: AI Content Recommendations ----
  html += '<div style="margin-bottom:8px;font-size:0.82rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;">🤖 Đề xuất AI — Ưu tiên theo Combined Signal Score</div>';

  visible.forEach(function(sug) {
    var tLabel = typeLabel[sug.type] || sug.type;
    var tColor = typeColor[sug.type] || '#94a3b8';
    var tBg = typeBg[sug.type] || '#f8fafc';
    var isHigh = sug.priority === 'high';
    var sid = (sug.id || '').replace(/'/g, "\\'");

    // Border theo trạng thái
    var borderColor = sug.status === 'scheduled' ? '#10b981'
                    : sug.status === 'saved' ? '#f59e0b'
                    : isHigh ? '#fca5a5' : 'var(--border-primary)';

    html += '<div style="background:var(--bg-primary);border:1px solid ' + borderColor + ';border-radius:12px;padding:16px;margin-bottom:14px;">';
    html += '<div style="display:flex;align-items:flex-start;gap:14px;">';
    html += scoreRing(sug.combined_score);
    html += '<div style="flex:1;">';
    // Title + badges
    html += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">';
    html += '<strong style="font-size:0.9rem;">' + sug.title + '</strong>';
    html += '<span style="background:' + tBg + ';color:' + tColor + ';font-size:0.68rem;font-weight:700;padding:2px 8px;border-radius:10px;">' + tLabel + '</span>';
    html += '<span style="background:#f1f5f9;color:#64748b;font-size:0.68rem;padding:2px 8px;border-radius:10px;">' + sug.platform + '</span>';
    if (sug.status === 'saved')      html += '<span style="background:#fffbeb;color:#f59e0b;font-size:0.68rem;font-weight:700;padding:2px 8px;border-radius:10px;">📌 Đã lưu</span>';
    if (sug.status === 'scheduled')  html += '<span style="background:#f0fdf4;color:#10b981;font-size:0.68rem;font-weight:700;padding:2px 8px;border-radius:10px;">🗓 Đã lên lịch</span>';
    if (sug._fromBackend)            html += '<span style="background:#dcfce7;color:#16a34a;font-size:0.62rem;padding:2px 6px;border-radius:8px;">↓ Backend</span>';
    html += '</div>';
    // Two signals
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">';
    // Chatbot signal
    html += '<div style="background:#eef2ff;border-radius:8px;padding:10px;">';
    html += '<div style="font-size:0.7rem;font-weight:700;color:#6366f1;margin-bottom:4px;">💬 Tín hiệu Chatbot</div>';
    html += '<div style="font-size:0.78rem;font-weight:700;color:var(--text-primary);">' + (sug.chatbot_signal.count || 0) + ' câu hỏi</div>';
    html += '<div style="font-size:0.72rem;color:var(--text-muted);">' + (sug.chatbot_signal.topic || '') + '</div>';
    html += '<div style="margin-top:6px;">' + (sug.chatbot_signal.sample_questions || []).slice(0,2).map(function(q) {
      return '<div style="font-size:0.68rem;color:#6366f1;padding:2px 0;">› "' + q + '"</div>';
    }).join('') + '</div>';
    html += '</div>';
    // Review signal
    if ((sug.review_signal.count || 0) > 0) {
      html += '<div style="background:#f0fdf4;border-radius:8px;padding:10px;">';
      html += '<div style="font-size:0.7rem;font-weight:700;color:#10b981;margin-bottom:4px;">⭐ Tín hiệu Review</div>';
      html += '<div style="font-size:0.78rem;font-weight:700;color:var(--text-primary);">' + sug.review_signal.count + ' đánh giá</div>';
      html += '<div style="font-size:0.72rem;color:var(--text-muted);">' + (sug.review_signal.neg_pct || 0) + '% lo ngại về chủ đề này</div>';
      html += '<div style="margin-top:6px;">' + (sug.review_signal.sample_reviews || []).slice(0,2).map(function(r) {
        return '<div style="font-size:0.68rem;color:#10b981;padding:2px 0;">› "' + r + '"</div>';
      }).join('') + '</div>';
      html += '</div>';
    } else {
      html += '<div style="background:#f0f9ff;border-radius:8px;padding:10px;">';
      html += '<div style="font-size:0.7rem;font-weight:700;color:#0ea5e9;margin-bottom:4px;">💼 Tín hiệu Thị trường</div>';
      html += '<div style="font-size:0.78rem;color:var(--text-muted);">Chưa có review — tín hiệu từ chatbot</div>';
      html += '<div style="font-size:0.72rem;color:#0ea5e9;margin-top:4px;">› Cơ hội chiếm lĩnh content trước</div>';
      html += '</div>';
    }
    html += '</div>';
    // Angle
    html += '<div style="background:#f8fafc;border-radius:8px;padding:10px;margin-bottom:10px;">';
    html += '<div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);margin-bottom:3px;">🎯 Góc tiếp cận đề xuất:</div>';
    html += '<div style="font-size:0.78rem;color:var(--text-secondary);">' + (sug.angle || '—') + '</div>';
    html += '</div>';
    // Impact + action buttons
    html += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">';
    html += '<div style="display:flex;gap:12px;flex-wrap:wrap;">';
    html += '<div style="font-size:0.72rem;color:#10b981;"><strong>📈 Impact:</strong> ' + (sug.estimated_impact || '') + '</div>';
    html += '<div style="font-size:0.72rem;color:var(--text-muted);"><strong>⏱ Sản xuất:</strong> ' + (sug.estimated_production || '') + '</div>';
    html += '</div>';
    html += '<div style="display:flex;gap:8px;">';
    if (sug.status === 'scheduled') {
      html += '<button class="alert-cta" style="background:#f0fdf4;color:#10b981;border:1px solid #10b981;" onclick="restoreSuggestion(\'' + sid + '\')">↩ Chuyển lại Pending</button>';
    } else if (sug.status === 'saved') {
      html += '<button class="alert-cta" style="background:var(--accent-emerald-bg);color:var(--accent-emerald);border:1px solid var(--accent-emerald);" onclick="scheduleSuggestion(\'' + sid + '\')">🗓 Lên lịch</button>';
      html += '<button class="alert-cta" style="background:var(--accent-rose-bg);color:var(--accent-rose);border:1px solid var(--accent-rose);" onclick="ignoreSuggestion(\'' + sid + '\')">✕ Bỏ qua</button>';
    } else {
      // pending
      html += '<button class="alert-cta" style="background:var(--accent-emerald-bg);color:var(--accent-emerald);border:1px solid var(--accent-emerald);" onclick="scheduleSuggestion(\'' + sid + '\')">✅ Lên lịch</button>';
      html += '<button class="alert-cta" style="background:#fffbeb;color:#f59e0b;border:1px solid #f59e0b;" onclick="saveSuggestion(\'' + sid + '\')">📌 Lưu lại</button>';
      html += '<button class="alert-cta" style="background:var(--accent-rose-bg);color:var(--accent-rose);border:1px solid var(--accent-rose);" onclick="ignoreSuggestion(\'' + sid + '\')">✕ Bỏ qua</button>';
    }
    html += '</div></div>';
    html += '</div></div></div>';
  });

  // Hiện số lượng đã bỏ qua (nếu có) + nút khôi phục
  if (ignored.length > 0) {
    html += '<div style="text-align:center;margin-bottom:16px;">'
      + '<span style="font-size:0.75rem;color:var(--text-muted);">' + ignored.length + ' đề xuất đã ẩn </span>'
      + '<button onclick="(function(){MOCK.content_suggestions_generated.forEach(function(s){if(s.status===\'ignored\')s.status=\'pending\';});navigate(\'content-suggestions\');})()" '
      + 'style="font-size:0.73rem;color:var(--accent-indigo);background:none;border:none;cursor:pointer;text-decoration:underline;">Hiện lại tất cả</button>'
      + '</div>';
  }

  // ---- SECTION 3: Content Performance + Calendar ----
  html += '<div class="grid-2" style="gap:16px;margin-bottom:20px;">';

  // Past performance
  html += '<div class="content-card" style="margin-bottom:0;">';
  html += '<div class="content-card-title" style="font-size:0.88rem;">📊 Hiệu quả Content đã xuất bản</div>';
  inv.forEach(function(item, i) {
    const typeEmoji = item.type === 'video' ? '🎬' : item.type === 'blog' ? '📝' : '❓';
    html += '<div style="padding:10px 0;' + (i < inv.length-1 ? 'border-bottom:1px solid var(--border-primary);' : '') + '">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">';
    html += '<span>' + typeEmoji + '</span><strong style="font-size:0.82rem;">' + item.title + '</strong></div>';
    html += '<div style="display:flex;gap:12px;">';
    html += '<div style="font-size:0.72rem;color:var(--text-muted);">👁 ' + item.views.toLocaleString() + ' lượt xem</div>';
    html += '<div style="font-size:0.72rem;color:#10b981;">↓ Giảm ' + item.questions_reduced + '% câu hỏi</div>';
    html += '</div></div>';
  });
  html += '<div style="margin-top:12px;padding:10px;background:#f0fdf4;border-radius:8px;font-size:0.75rem;color:#065f46;">💡 TB mỗi content giảm <strong>33% câu hỏi chatbot</strong> trong chủ đề tương ứng</div>';
  html += '</div>';

  // Content calendar — xây từ pending/saved/scheduled suggestions
  html += '<div class="content-card" style="margin-bottom:0;">';
  html += '<div class="content-card-title" style="font-size:0.88rem;">🗓 Lịch Content đề xuất</div>';
  var calHighPrio = sugs.filter(function(s){return s.status==='pending'&&s.priority==='high';}).slice(0,3);
  var calMedPrio  = sugs.filter(function(s){return s.status==='pending'&&s.priority==='medium';}).slice(0,2);
  var calSaved    = sugs.filter(function(s){return s.status==='saved';}).slice(0,2);
  var calScheduled = sugs.filter(function(s){return s.status==='scheduled';}).slice(0,3);
  var calItems = [
    { week: 'Tuần này (ưu tiên cao 🔴)', sugs: calHighPrio, color: '#ef4444', bg: '#fef2f2',
      fallback: '(Chưa có đề xuất cao — nhấn "Tạo từ báo cáo" để thêm)' },
    { week: '2 tuần tới', sugs: calMedPrio, color: '#f59e0b', bg: '#fffbeb',
      fallback: '(Chưa có đề xuất ưu tiên vừa)' },
    { week: 'Đã lưu 📌', sugs: calSaved, color: '#f59e0b', bg: '#fffbeb',
      fallback: calSaved.length===0 ? '(Chưa có item nào đã lưu)' : null },
    { week: 'Đã lên lịch ✅', sugs: calScheduled, color: '#10b981', bg: '#f0fdf4',
      fallback: calScheduled.length===0 ? '(Chưa lên lịch item nào)' : null }
  ].filter(function(c){ return !(c.sugs.length===0 && !c.fallback); });
  calItems.forEach(function(cal) {
    html += '<div style="margin-bottom:12px;">';
    html += '<div style="font-size:0.72rem;font-weight:700;background:' + cal.bg + ';color:' + cal.color + ';padding:4px 10px;border-radius:6px;display:inline-block;margin-bottom:6px;">' + cal.week + '</div>';
    if (cal.sugs.length === 0) {
      html += '<div style="font-size:0.75rem;color:var(--text-muted);padding:4px 0;">' + cal.fallback + '</div>';
    } else {
      cal.sugs.forEach(function(s) {
        var label = (s.title||'').length > 50 ? (s.title||'').substring(0,50) + '…' : (s.title||'');
        var sid2 = (s.id||'').replace(/'/g,"\\'");
        html += '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:0.78rem;">';
        html += '<div style="width:6px;height:6px;border-radius:50%;background:' + cal.color + ';flex-shrink:0;"></div>';
        html += '<span style="flex:1;">' + label + '</span>';
        if (s.status === 'pending' || s.status === 'saved') {
          html += '<button onclick="scheduleSuggestion(\'' + sid2 + '\')" style="font-size:0.65rem;padding:2px 6px;border:1px solid #10b981;background:#f0fdf4;color:#10b981;border-radius:6px;cursor:pointer;white-space:nowrap;">🗓 Lên lịch</button>';
        }
        html += '</div>';
      });
    }
    html += '</div>';
  });
  html += '</div>';
  html += '</div>'; // grid-2

  return html;
}

function renderProductDescriptions() {
  const prods = MOCK.products_detail;
  const prod = prods.find(function(p) { return p.sku === currentProductDescSku; }) || prods[0];

  // Build AI recommendations for the selected product
  function buildRecs(p) {
    const recs = [];
    // Find top chatbot topics not in description
    p.chatbot_questions.forEach(function(q) {
      const inDesc = p.description_key_points.some(function(kp) {
        return q.topic.toLowerCase().includes(kp.toLowerCase()) || kp.toLowerCase().includes(q.topic.toLowerCase());
      });
      const feat = p.review_features.find(function(f) { return f.feature.toLowerCase().includes(q.topic.split(' ')[0].toLowerCase()); });
      if (!inDesc && q.count >= 8) {
        const type = feat && feat.negative > feat.positive ? 'EXPAND' : 'ADD';
        recs.push({
          action: type,
          section: q.topic,
          chatbot_count: q.count,
          review_mentions: feat ? feat.mentions : 0,
          review_neg: feat ? feat.negative : 0,
          review_pos: feat ? feat.positive : 0,
          sample_q: q.sample,
          sample_review: feat ? (feat.sample_neg || feat.sample_pos || '') : '',
          suggestion: type === 'ADD' ?
            'Thêm mục "' + q.topic + '" vào mô tả sản phẩm với thông tin chi tiết' :
            'Bổ sung phần "' + q.topic + '" với thông số kỹ thuật và cam kết chất lượng cụ thể'
        });
      }
    });
    // Check for mismatch: description highlights something but reviews are negative about it
    p.review_features.forEach(function(f) {
      if (f.negative > f.positive && f.negative >= 8) {
        const inDesc = p.description_key_points.some(function(kp) {
          return f.feature.toLowerCase().includes(kp.toLowerCase());
        });
        if (inDesc) {
          recs.push({
            action: 'CLARIFY',
            section: f.feature,
            chatbot_count: 0,
            review_mentions: f.mentions,
            review_neg: f.negative,
            review_pos: f.positive,
            sample_q: '',
            sample_review: f.sample_neg || '',
            suggestion: 'Mô tả đang nhấn mạnh "' + f.feature + '" nhưng review tiêu cực về điểm này — cần làm rõ kỳ vọng thực tế'
          });
        }
      }
    });
    return recs.sort(function(a,b) { return (b.chatbot_count + b.review_mentions) - (a.chatbot_count + a.review_mentions); });
  }

  const recs = buildRecs(prod);

  function actionBadge(action) {
    if (action === 'ADD') return '<span style="background:#eef2ff;color:#6366f1;font-size:0.7rem;font-weight:700;padding:3px 8px;border-radius:6px;">➕ THÊM MỚI</span>';
    if (action === 'EXPAND') return '<span style="background:#fffbeb;color:#f59e0b;font-size:0.7rem;font-weight:700;padding:3px 8px;border-radius:6px;">📝 MỞ RỘNG</span>';
    if (action === 'CLARIFY') return '<span style="background:#fef2f2;color:#ef4444;font-size:0.7rem;font-weight:700;padding:3px 8px;border-radius:6px;">⚠ LÀM RÕ</span>';
    return '';
  }

  function impactBar(chatbot, review) {
    const total = chatbot + review;
    const maxW = 120;
    const cW = total > 0 ? Math.round((chatbot / total) * maxW) : 0;
    const rW = total > 0 ? Math.round((review / total) * maxW) : 0;
    return '<div style="display:flex;align-items:center;gap:4px;margin-top:4px;">'
      + (chatbot > 0 ? '<div style="height:6px;width:' + cW + 'px;background:#6366f1;border-radius:2px;" title="Chatbot: ' + chatbot + '"></div>' : '')
      + (review > 0 ? '<div style="height:6px;width:' + rW + 'px;background:#10b981;border-radius:2px;" title="Review: ' + review + '"></div>' : '')
      + '</div>'
      + '<div style="display:flex;gap:8px;margin-top:2px;">'
      + (chatbot > 0 ? '<span style="font-size:0.65rem;color:#6366f1;">💬 ' + chatbot + ' hỏi</span>' : '')
      + (review > 0 ? '<span style="font-size:0.65rem;color:#10b981;">⭐ ' + review + ' review</span>' : '')
      + '</div>';
  }

  // ---- PRODUCT SELECTOR ----
  let html = '<div class="content-card" style="margin-bottom:20px;">';
  html += '<div class="content-card-title" style="margin-bottom:12px;">📝 Tối ưu mô tả sản phẩm với AI</div>';
  html += '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:14px;">Phân tích câu hỏi chatbot + đánh giá review để tìm điểm mù trong mô tả sản phẩm</div>';
  html += '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
  prods.forEach(function(p) {
    const active = p.sku === currentProductDescSku;
    html += '<button onclick="currentProductDescSku=\'' + p.sku + '\';navigate(\'product-descriptions\')" style="padding:8px 14px;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;border:1.5px solid ' + (active ? 'var(--accent-indigo)' : 'var(--border-primary)') + ';background:' + (active ? 'var(--accent-indigo-bg,#eef2ff)' : 'var(--bg-secondary)') + ';color:' + (active ? 'var(--accent-indigo)' : 'var(--text-secondary)') + ';">' + p.name + '</button>';
  });
  html += '</div></div>';

  // ---- SUMMARY STATS ----
  const totalChatQ = prod.chatbot_questions.reduce(function(s,q) { return s + q.count; }, 0);
  const totalRevFeat = prod.review_features.reduce(function(s,f) { return s + f.mentions; }, 0);
  const negSignals = prod.review_features.filter(function(f) { return f.negative > f.positive; }).length;
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">';
  const stats = [
    { label: 'Câu hỏi chatbot', value: totalChatQ, sub: '7 ngày qua', color: '#6366f1', bg: '#eef2ff' },
    { label: 'Đề cập trong review', value: totalRevFeat, sub: 'về tính năng SP', color: '#10b981', bg: '#f0fdf4' },
    { label: 'Điểm mù trong mô tả', value: recs.length, sub: 'cần cập nhật', color: '#ef4444', bg: '#fef2f2' },
    { label: 'Tính năng lo ngại', value: negSignals, sub: 'review tiêu cực > tích cực', color: '#f59e0b', bg: '#fffbeb' }
  ];
  stats.forEach(function(s) {
    html += '<div style="background:' + s.bg + ';border-radius:12px;padding:14px;text-align:center;">';
    html += '<div style="font-size:1.6rem;font-weight:800;color:' + s.color + ';">' + s.value + '</div>';
    html += '<div style="font-size:0.75rem;font-weight:700;color:' + s.color + ';">' + s.label + '</div>';
    html += '<div style="font-size:0.68rem;color:' + s.color + ';opacity:0.7;">' + s.sub + '</div>';
    html += '</div>';
  });
  html += '</div>';

  // ---- SECTION 1: Feature Priority Matrix ----
  html += '<div class="content-card" style="margin-bottom:20px;">';
  html += '<div class="content-card-title">🗂 Ma trận ưu tiên tính năng — ' + prod.name + '</div>';
  html += '<div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:14px;">Kích thước bar = mức độ quan tâm. Màu = cảm xúc khách hàng về tính năng đó</div>';
  const allFeats = prod.review_features.slice().sort(function(a,b) { return b.mentions - a.mentions; });
  const maxMentions = Math.max.apply(null, allFeats.map(function(f) { return f.mentions; }));
  allFeats.forEach(function(f) {
    const pct = Math.round((f.mentions / maxMentions) * 100);
    const posRatio = f.mentions > 0 ? f.positive / f.mentions : 0;
    const barColor = posRatio > 0.7 ? '#10b981' : posRatio > 0.4 ? '#f59e0b' : '#ef4444';
    const sentLabel = posRatio > 0.7 ? 'Tích cực' : posRatio > 0.4 ? 'Hỗn hợp' : 'Tiêu cực';
    const sentColor = posRatio > 0.7 ? '#10b981' : posRatio > 0.4 ? '#f59e0b' : '#ef4444';
    html += '<div style="margin-bottom:12px;">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">';
    html += '<div style="display:flex;align-items:center;gap:8px;">';
    html += '<strong style="font-size:0.82rem;">' + f.feature + '</strong>';
    html += '<span style="font-size:0.68rem;color:' + sentColor + ';font-weight:700;">' + sentLabel + '</span>';
    html += '</div>';
    html += '<div style="font-size:0.72rem;color:var(--text-muted);">' + f.mentions + ' lần đề cập (' + f.positive + ' 😊 / ' + f.negative + ' 😞)</div>';
    html += '</div>';
    html += '<div style="background:var(--bg-secondary);border-radius:4px;height:10px;overflow:hidden;">';
    html += '<div style="height:100%;width:' + pct + '%;background:' + barColor + ';border-radius:4px;transition:width 0.5s;"></div>';
    html += '</div>';
    if (f.sample_neg) {
      html += '<div style="font-size:0.7rem;color:#ef4444;margin-top:3px;">😞 "' + f.sample_neg + '"</div>';
    } else if (f.sample_pos) {
      html += '<div style="font-size:0.7rem;color:#10b981;margin-top:3px;">😊 "' + f.sample_pos + '"</div>';
    }
    html += '</div>';
  });
  html += '</div>';

  // ---- SECTION 2: Description Gap + Before/After ----
  html += '<div class="content-card" style="margin-bottom:20px;">';
  html += '<div class="content-card-title">📄 Mô tả hiện tại — Phân tích khoảng trống</div>';
  html += '<div class="grid-2" style="gap:16px;">';
  // Current description
  html += '<div>';
  html += '<div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;">Mô tả HIỆN TẠI</div>';
  html += '<div style="background:var(--bg-secondary);border-radius:8px;padding:14px;font-size:0.82rem;color:var(--text-secondary);line-height:1.6;border-left:3px solid var(--border-primary);">' + prod.description_current + '</div>';
  html += '<div style="margin-top:10px;"><div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);margin-bottom:6px;">Điểm nhấn hiện tại:</div>';
  html += prod.description_key_points.map(function(kp) {
    return '<span style="background:var(--bg-secondary);border:1px solid var(--border-primary);font-size:0.72rem;padding:3px 8px;border-radius:10px;margin:2px;display:inline-block;">✓ ' + kp + '</span>';
  }).join('');
  html += '</div></div>';
  // What customers actually ask about
  html += '<div>';
  html += '<div style="font-size:0.75rem;font-weight:700;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;">Khách hỏi NHIỀU NHẤT</div>';
  prod.chatbot_questions.sort(function(a,b) { return b.count - a.count; }).forEach(function(q) {
    const inDesc = prod.description_key_points.some(function(kp) {
      return q.topic.toLowerCase().includes(kp.toLowerCase()) || kp.toLowerCase().includes(q.topic.split(' ')[0].toLowerCase());
    });
    html += '<div style="display:flex;align-items:center;gap:8px;padding:8px;margin-bottom:6px;border-radius:8px;background:' + (inDesc ? '#f0fdf4' : '#fef2f2') + ';">';
    html += '<div style="flex:1;">';
    html += '<div style="font-size:0.8rem;font-weight:600;">' + q.topic + '</div>';
    html += '<div style="font-size:0.7rem;color:var(--text-muted);">"' + q.sample + '"</div>';
    html += '</div>';
    html += '<div style="text-align:right;">';
    html += '<div style="font-size:0.9rem;font-weight:800;color:' + (inDesc ? '#10b981' : '#ef4444') + ';">' + q.count + 'x</div>';
    html += '<div style="font-size:0.65rem;color:' + (inDesc ? '#10b981' : '#ef4444') + ';">' + (inDesc ? '✓ Có trong mô tả' : '✗ Chưa có') + '</div>';
    html += '</div></div>';
  });
  html += '</div>';
  html += '</div></div>'; // grid-2 + card

  // ---- SECTION 3: AI Recommendations ----
  html += '<div class="content-card" style="margin-bottom:20px;">';
  html += '<div class="content-card-title">🤖 Đề xuất AI — Cập nhật mô tả sản phẩm</div>';
  html += '<div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:14px;">Mỗi đề xuất kết hợp dữ liệu từ chatbot + review để đề xuất cụ thể nhất có thể</div>';

  if (recs.length === 0) {
    html += '<div style="text-align:center;padding:24px;color:var(--text-muted);">✅ Mô tả sản phẩm đang đầy đủ — không có khoảng trống lớn nào</div>';
  } else {
    recs.forEach(function(rec, i) {
      html += '<div style="border:1px solid var(--border-primary);border-radius:12px;padding:14px;margin-bottom:12px;">';
      html += '<div style="display:flex;align-items:flex-start;gap:12px;">';
      html += '<div style="width:36px;height:36px;border-radius:8px;background:var(--bg-secondary);display:flex;align-items:center;justify-content:center;font-weight:800;color:var(--accent-indigo);flex-shrink:0;">' + (i+1) + '</div>';
      html += '<div style="flex:1;">';
      html += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">';
      html += actionBadge(rec.action);
      html += '<strong style="font-size:0.88rem;">' + rec.section + '</strong>';
      html += '</div>';
      // Signal bars
      html += impactBar(rec.chatbot_count, rec.review_mentions);
      html += '<div style="margin-top:8px;">';
      if (rec.chatbot_count > 0) {
        html += '<div style="font-size:0.72rem;color:#6366f1;margin-bottom:2px;">💬 Câu hỏi chatbot: "' + rec.sample_q + '"</div>';
      }
      if (rec.sample_review) {
        html += '<div style="font-size:0.72rem;color:' + (rec.review_neg > rec.review_pos ? '#ef4444' : '#10b981') + ';margin-bottom:6px;">⭐ Review: "' + rec.sample_review + '"</div>';
      }
      html += '<div style="background:#f8fafc;border-radius:8px;padding:10px;margin-top:6px;">';
      html += '<div style="font-size:0.72rem;font-weight:700;color:var(--text-muted);margin-bottom:3px;">💡 Đề xuất cụ thể:</div>';
      html += '<div style="font-size:0.78rem;color:var(--text-secondary);">' + rec.suggestion + '</div>';
      html += '</div>';
      html += '</div>';
      // Actions
      html += '<div style="display:flex;gap:8px;margin-top:10px;">';
      html += '<button class="alert-cta" style="background:var(--accent-emerald-bg);color:var(--accent-emerald);border:1px solid var(--accent-emerald);" onclick="showToast(\'Đã áp dụng cập nhật mô tả!\', \'success\')">✅ Áp dụng</button>';
      html += '<button class="alert-cta" onclick="showToast(\'Đã mở chỉnh sửa thủ công\', \'info\')">✏️ Chỉnh sửa</button>';
      html += '<button class="alert-cta" style="background:var(--accent-rose-bg);color:var(--accent-rose);" onclick="showToast(\'Đã bỏ qua đề xuất này\', \'warning\')">✕ Bỏ qua</button>';
      html += '</div></div></div></div>';
    });
  }
  html += '</div>';

  // ---- SECTION 4: Before/After Preview ----
  html += '<div class="content-card">';
  html += '<div class="content-card-title">👁 Preview — Trước & Sau tối ưu AI</div>';
  html += '<div class="grid-2" style="gap:16px;">';

  // Before
  html += '<div>';
  html += '<div style="font-size:0.75rem;font-weight:700;color:#ef4444;margin-bottom:8px;text-transform:uppercase;">⬛ Mô tả TRƯỚC — Thiếu thông tin quan trọng</div>';
  html += '<div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:14px;font-size:0.82rem;color:#7f1d1d;line-height:1.7;">' + prod.description_current + '</div>';
  html += '<div style="margin-top:8px;font-size:0.72rem;color:#ef4444;">❌ ' + recs.length + ' điểm thiếu — ' + prod.chatbot_questions.filter(function(q){return q.count>=8;}).length + ' câu hỏi phổ biến chưa được trả lời trước</div>';
  html += '</div>';

  // After (AI-enhanced)
  html += '<div>';
  html += '<div style="font-size:0.75rem;font-weight:700;color:#10b981;margin-bottom:8px;text-transform:uppercase;">✅ Mô tả SAU — AI đề xuất bổ sung</div>';

  // Build enhanced description
  let enhanced = prod.description_current;
  recs.slice(0, 2).forEach(function(rec) {
    if (rec.action === 'ADD') enhanced += ' | ' + rec.section + ': [AI sẽ điền thông số cụ thể dựa trên specs thực tế]';
    if (rec.action === 'EXPAND') enhanced += ' | ' + rec.section + ': [AI tái viết với cam kết + thông số kỹ thuật rõ ràng]';
  });

  html += '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px;font-size:0.82rem;color:#064e3b;line-height:1.7;">' + enhanced + '</div>';
  html += '<div style="margin-top:8px;">';
  recs.slice(0, 3).forEach(function(rec) {
    html += '<div style="font-size:0.7rem;color:#10b981;padding:2px 0;">✅ Thêm mục: <strong>' + rec.section + '</strong> (dự kiến giảm ' + rec.chatbot_count + ' câu hỏi/tuần)</div>';
  });
  html += '</div>';
  html += '<div style="margin-top:10px;display:flex;gap:8px;">';
  html += '<button class="alert-cta" style="background:var(--accent-emerald-bg);color:var(--accent-emerald);border:1px solid var(--accent-emerald);" onclick="showToast(\'Đã áp dụng tất cả đề xuất!\', \'success\')">✅ Áp dụng tất cả</button>';
  html += '<button class="alert-cta" onclick="showToast(\'Đang xuất bản lên Shopee...\', \'info\')">🚀 Publish Shopee</button>';
  html += '</div>';
  html += '</div>';

  html += '</div></div>'; // grid-2 + card

  return html;
}


// ===== Demo Khách Hàng Page =====
function renderDemoCustomer() {
  // Nội dung thực (form review + live chat widget) được inject bởi api_integration.js
  // Hàm này chỉ trả về skeleton để tránh trang trắng trong trường hợp backend chưa tải
  return `
    <div style="display:flex;flex-direction:column;gap:20px;">
      <div style="padding:16px 20px;background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(16,185,129,0.06));
        border-radius:12px;border:1px solid rgba(99,102,241,0.15);">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <span style="font-size:1.6rem;">🧑‍💻</span>
          <div>
            <div style="font-weight:800;font-size:1rem;color:var(--text-primary);">Khu vực Demo Khách Hàng</div>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px;">
              Mô phỏng hành trình khách hàng — Gửi đánh giá sản phẩm và nhắn tin trực tiếp với AI Agent
            </div>
          </div>
        </div>
      </div>
      <div id="demoCustomerPlaceholder" style="text-align:center;padding:32px;color:var(--text-muted);font-size:0.85rem;">
        ⏳ Đang tải các module...
      </div>
    </div>
  `;
}

const ROUTES = {
  dashboard: { title: 'Dashboard', subtitle: 'Tổng quan chiến lược AI – Cập nhật lúc 07:31', render: renderDashboard },
  'ai-suggestions': { title: 'Đề xuất AI', subtitle: 'Human-in-the-loop · Phê duyệt chiến lược do AI đề xuất', render: renderAISuggestions },
  revenue: { title: 'Doanh thu & Chi phí', subtitle: 'Phân tích tài chính thời gian thực – Cập nhật lúc 07:32', render: renderRevenue },
  inventory: { title: 'Quản lý Tồn kho', subtitle: 'Cảnh báo và tối ưu vòng quay vốn – Cập nhật lúc 07:33', render: renderInventory },
  competitor: { title: 'Phân tích Đối thủ', subtitle: 'So sánh giá & Market share – Cập nhật lúc 07:33', render: renderCompetitor },
  reviews: { title: 'Review Sản phẩm', subtitle: 'Sentiment Analysis từ khách hàng – Cập nhật lúc 07:33', render: renderReviews },
  media: { title: 'Media & Quảng cáo', subtitle: 'Hiệu suất Ads và Content (Shopee & TikTok) – Cập nhật lúc 07:33', render: renderMedia },
  'crisis-center': { title: 'Trung tâm Khủng hoảng', subtitle: 'Orchestrator Agent · Phát hiện & Xử lý tự động', render: renderCrisisCenter },
  chat: { title: 'Chat AI Inbox', subtitle: 'Hệ thống tự động phân loại và phản hồi – Cập nhật lúc 07:33', render: renderChat },
  settings: { title: 'Cài đặt & Hồ sơ', subtitle: 'Cấu hình doanh nghiệp và AI Agent', render: renderSettings },
  'ai-performance': { title: 'Hiệu suất AI Agent', subtitle: 'Đánh giá kết quả vận hành của các Agent', render: renderAIPerformance },
  'market-overview': { title: 'Tổng quan ngành hàng', subtitle: 'Xu hướng & thị phần thị trường — Cập nhật hàng ngày', render: renderMarketOverview },
  'chat-sentiment': { title: 'Sentiment Analysis', subtitle: 'Phân tích cảm xúc khách hàng từ toàn bộ hội thoại', render: renderChatSentiment },
  'chat-report': { title: 'Báo cáo thắc mắc', subtitle: 'Vấn đề & câu hỏi phổ biến nhất từ khách hàng', render: renderChatReport },
  'chat-insights': { title: 'Tổng hợp từ Chatbot', subtitle: 'Pattern detection — AI phân tích toàn bộ hội thoại', render: renderChatInsights },
  'content-suggestions': { title: 'Đề xuất Content', subtitle: 'AI gợi ý nội dung dựa trên dữ liệu thực', render: renderContentSuggestions },
  'product-descriptions': { title: 'Mô tả Sản phẩm', subtitle: 'Tối ưu mô tả sản phẩm với AI', render: renderProductDescriptions },
  'demo-customer': { title: 'Demo Khách Hàng', subtitle: 'Thử nghiệm trải nghiệm khách hàng — Gửi Review & Live Chat AI', render: renderDemoCustomer }
};

let currentPage = 'dashboard';
function navigate(page) {
  if (!ROUTES[page]) page = 'dashboard';
  currentPage = page;
  const r = ROUTES[page];
  document.getElementById('pageTitle').textContent = r.title;
  document.getElementById('pageSubtitle').textContent = r.subtitle;
  document.getElementById('pageContent').innerHTML = r.render();
  syncSidebarActive(page);
  document.querySelector('.main-content').scrollTo({ top: 0, behavior: 'smooth' });
}

function syncSidebarActive(page) {
  // Clear active on all nav items (top-level + children)
  document.querySelectorAll('.nav-item[data-page], .nav-child-item[data-page]').forEach(function(el) {
    el.classList.remove('active');
  });
  // Clear group highlights
  document.querySelectorAll('.nav-group').forEach(function(g) {
    g.classList.remove('has-active');
  });
  // Set active on matching element
  var match = document.querySelector('.nav-item[data-page="' + page + '"], .nav-child-item[data-page="' + page + '"]');
  if (!match) return;
  match.classList.add('active');
  // Propagate to parent group if child item
  var group = match.closest('.nav-group');
  if (group) {
    group.classList.add('has-active');
    if (!group.classList.contains('open')) group.classList.add('open');
  }
}

/* =====================================================================
   6. EVENT DELEGATION
   ===================================================================== */
function initEvents() {
  // Sidebar — top-level items
  document.querySelectorAll('.nav-item[data-page]').forEach(function(btn) {
    btn.addEventListener('click', function() { if (btn.dataset.page) navigate(btn.dataset.page); });
  });
  // Sidebar — child items inside accordion groups
  document.querySelectorAll('.nav-child-item[data-page]').forEach(function(btn) {
    btn.addEventListener('click', function() { if (btn.dataset.page) navigate(btn.dataset.page); });
  });
  // Group header toggle
  document.querySelectorAll('.nav-group-header').forEach(function(header) {
    header.addEventListener('click', function() { header.closest('.nav-group').classList.toggle('open'); });
  });

  // Scan button
  document.getElementById('btnScan').addEventListener('click', runScan);

  // Notification button
  document.getElementById('btnNotification').addEventListener('click', () => {
    showToast('Bạn có 5 thông báo mới: 3 đề xuất AI chờ duyệt, 2 cảnh báo tồn kho', 'info');
  });

  // Guidance toolbar tags
  document.querySelectorAll('.guidance-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const cmd = tag.dataset.cmd;
      document.getElementById('guidanceInput').value = cmd;
      activateGuidance(cmd);
    });
  });

  document.getElementById('guidanceSendBtn').addEventListener('click', () => {
    const v = document.getElementById('guidanceInput').value.trim();
    if (v) activateGuidance(v);
  });

  document.getElementById('guidanceClearBtn').addEventListener('click', () => {
    document.getElementById('guidanceActiveCmd').style.display = 'none';
    document.getElementById('guidanceInput').value = '';
    showToast('Đã hủy chỉ thị chiến lược', 'info');
  });

  // Modal events
  document.getElementById('modalCloseBtn').addEventListener('click', closeFeedbackModal);
  document.getElementById('modalCancelBtn').addEventListener('click', closeFeedbackModal);
  document.getElementById('feedbackText').addEventListener('input', (e) => {
    document.getElementById('modalSubmitBtn').disabled = e.target.value.trim().length < 5;
  });
  document.getElementById('modalSubmitBtn').addEventListener('click', () => {
    const reason = document.getElementById('feedbackText').value;
    const sug = MOCK.suggestions.find(s => s.id === pendingFeedbackId);
    if (sug) {
      sug.status = 'rejected';
      sug.rejection_reason = reason;
    }
    closeFeedbackModal();
    showToast(`AI đang điều chỉnh lại đề xuất dựa trên feedback của bạn... 🔄`, 'warning');
    setTimeout(() => {
      navigate(currentPage);
    }, 1000);
  });

  // Page-level delegation
  document.getElementById('pageContent').addEventListener('click', handlePageClick);
}

function activateGuidance(cmd) {
  document.getElementById('guidanceActiveCmd').style.display = 'flex';
  document.getElementById('guidanceActiveCmdText').textContent = cmd;
  showToast(`AI đã nhận chỉ thị: "${cmd.substring(0, 50)}${cmd.length>50?'...':''}"`, 'success');
}

function handlePageClick(e) {
  // ── Ưu tiên: Các nút dùng class (chat inbox buttons) ──
  const chatBtn = e.target.closest(
    '.btn-chat-accept, .btn-chat-edit, .btn-chat-send-edited, .btn-chat-cancel-edit'
  );
  if (chatBtn) {
    // Gửi ngay
    if (chatBtn.classList.contains('btn-chat-accept')) {
      const msgs = MOCK.chat_messages[currentChatId] || [];
      const draftMsg = msgs.find(m => m.from === 'ai_draft');
      if (draftMsg) {
        const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        MOCK.chat_messages[currentChatId] = msgs.filter(m => m.from !== 'ai_draft' && m.from !== 'ai_thinking');
        MOCK.chat_messages[currentChatId].push({ from: 'ai_sent', time: now, text: draftMsg.text });
        const conv = MOCK.conversations.find(c => c.id === currentChatId);
        if (conv) { conv.status = 'auto'; conv.unread = 0; conv.wait_min = 0;
          conv.preview = draftMsg.text.substring(0, 55) + (draftMsg.text.length > 55 ? '...' : '');
          conv.time = now; }
      }
      chatDraftEditMode = false;
      showToast('✅ Tin nhắn đã gửi cho khách. AI ghi nhận để học.', 'success');
      setTimeout(() => navigate('chat'), 200);
      return;
    }
    // Sửa nháp
    if (chatBtn.classList.contains('btn-chat-edit')) {
      chatDraftEditMode = true;
      navigate('chat');
      setTimeout(() => {
        const ta = document.getElementById('chatDraftEditArea');
        if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
      }, 120);
      return;
    }
    // Gửi bản đã sửa
    if (chatBtn.classList.contains('btn-chat-send-edited')) {
      const ta = document.getElementById('chatDraftEditArea');
      const editedText = ta ? ta.value.trim() : '';
      if (!editedText) { showToast('⚠️ Nội dung không được để trống!', 'warning'); return; }
      const msgs = MOCK.chat_messages[currentChatId] || [];
      const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      MOCK.chat_messages[currentChatId] = msgs.filter(m => m.from !== 'ai_draft' && m.from !== 'ai_thinking');
      MOCK.chat_messages[currentChatId].push({ from: 'ai_sent', time: now, text: editedText, edited: true });
      const conv = MOCK.conversations.find(c => c.id === currentChatId);
      if (conv) { conv.status = 'auto'; conv.unread = 0; conv.wait_min = 0;
        conv.preview = editedText.substring(0, 55) + (editedText.length > 55 ? '...' : '');
        conv.time = now; }
      chatDraftEditMode = false;
      showToast('✅ Đã gửi bản nháp đã chỉnh sửa cho khách!', 'success');
      setTimeout(() => navigate('chat'), 200);
      return;
    }
    // Hủy chỉnh sửa
    if (chatBtn.classList.contains('btn-chat-cancel-edit')) {
      chatDraftEditMode = false;
      navigate('chat');
      return;
    }
  }

  const target = e.target.closest('[data-action], [data-nav], [data-tab], [data-type], [data-stab], [data-conv]');
  if (!target) return;

  // Navigation links inside content
  if (target.dataset.nav) {
    e.preventDefault();
    navigate(target.dataset.nav);
    return;
  }

  // AI Suggestions tabs
  if (target.dataset.tab) {
    currentSugTab = target.dataset.tab;
    navigate('ai-suggestions');
    return;
  }
  if (target.dataset.type) {
    currentSugType = target.dataset.type;
    navigate('ai-suggestions');
    return;
  }

  // Settings tabs
  if (target.dataset.stab) {
    currentSettingsTab = target.dataset.stab;
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.toggle('active', t.dataset.stab === currentSettingsTab));
    document.getElementById('settingsTabContent').innerHTML = renderSettingsTab();
    return;
  }

  // Chat conversation switch
  if (target.dataset.chatfilter) {
    chatFilter = target.dataset.chatfilter;
    navigate('chat');
    return;
  }
  if (target.dataset.conv) {
    currentChatId = target.dataset.conv;
    navigate('chat');
    return;
  }

  // Suggestion actions
  if (target.dataset.action) {
    const action = target.dataset.action;
    const id = target.dataset.id;
    const sug = MOCK.suggestions.find(s => s.id === id);

    if (action === 'detail' && sug) {
      openSlideover(sug);
    } else if (action === 'approve' && sug) {
      sug.status = 'approved';
      showToast(`✅ Đã duyệt: "${sug.title}" — AI đang triển khai...`, 'success');
      setTimeout(() => navigate(currentPage), 800);
    } else if (action === 'deny' && sug) {
      openFeedbackModal(id);
    } else if (action === 'ai-reply') {
      const author = target.dataset.author;
      showToast(`AI đang soạn phản hồi cho ${author}... Sẽ hiển thị trong inbox khi sẵn sàng`, 'info');
    } else if (action === 'deny-chat') {
      // Xóa nháp AI, thêm thông báo hệ thống, re-render
      const msgs = MOCK.chat_messages[currentChatId] || [];
      MOCK.chat_messages[currentChatId] = msgs.filter(m => m.from !== 'ai_draft' && m.from !== 'ai_thinking');
      MOCK.chat_messages[currentChatId].push({
        from: 'system',
        text: '🔄 Nháp bị từ chối — AI đang soạn phản hồi mới...'
      });
      chatDraftEditMode = false;
      showToast('Đã từ chối nháp AI. AI sẽ tạo nháp khác.', 'warning');
      setTimeout(() => navigate('chat'), 300);
    } else if (action === 'chat-send-msg') {
      // Gửi tin nhắn từ chủ shop qua ô input
      const input = document.getElementById('chatMsgInput');
      const text = input ? input.value.trim() : '';
      if (!text) return;
      input.value = '';
      if (!MOCK.chat_messages[currentChatId]) MOCK.chat_messages[currentChatId] = [];
      const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      MOCK.chat_messages[currentChatId].push({ from: 'shop_owner', time: now, text });
      const conv = MOCK.conversations.find(c => c.id === currentChatId);
      if (conv) { conv.preview = text.substring(0, 55) + (text.length > 55 ? '...' : ''); conv.time = now; }
      navigate('chat');
      return;
    }
  }

  // Quick-reply template buttons in chat input area
  if (target.dataset.chattemplate) {
    const text = target.dataset.chattemplate;
    if (!MOCK.chat_messages[currentChatId]) MOCK.chat_messages[currentChatId] = [];
    const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    MOCK.chat_messages[currentChatId].push({ from: 'shop_owner', time: now, text });
    const conv = MOCK.conversations.find(c => c.id === currentChatId);
    if (conv) { conv.preview = text.substring(0, 55); conv.time = now; }
    navigate('chat');
    return;
  }

  // Restock button
  if (target.id === 'btnRestock') {
    showToast('🤖 AI đã soạn email yêu cầu nhập hàng cho 3 SKU. Mở để xem trước khi gửi.', 'success');
  }

  // Competitor product change
  if (target.id === 'compProductSelect') {
    return; // handled by change event
  }

  // Crisis Center events
  if (target.dataset.crisisid && target.dataset.actid) {
    const crisis = MOCK.crises.find(c => c.id === target.dataset.crisisid);
    const act = crisis && crisis.actions.find(a => a.id === target.dataset.actid);
    if (target.classList.contains('btn-crisis-action') && act) {
      act.status = 'done';
      act.done_by = 'Chủ shop';
      act.done_at = new Date().toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'});
      showToast(`✅ Đã thực hiện: "${act.title}"`, 'success');
      setTimeout(() => navigate('crisis-center'), 600);
    }
    if (target.classList.contains('btn-crisis-draft') && act && act.draft) {
      crisisActionDraft = act;
      const panel = document.getElementById('crisisDraftPanel');
      if (panel) {
        panel.style.display = 'block';
        panel.innerHTML = `<div class="content-card" style="border:2px solid var(--accent-emerald);margin-top:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div class="content-card-title" style="margin:0;color:var(--accent-emerald);">📝 Nháp AI — ${act.title}</div>
            <button onclick="document.getElementById('crisisDraftPanel').style.display='none'" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:1.1rem;">✕</button>
          </div>
          <div style="background:var(--bg-glass);padding:14px;border-radius:10px;font-size:0.85rem;line-height:1.7;white-space:pre-line;margin-bottom:14px;">${act.draft}</div>
          <div style="display:flex;gap:10px;">
            <button class="btn-approve" onclick="showToast('✅ Đã gửi thành công!','success');document.getElementById('crisisDraftPanel').style.display='none';" style="flex:1;">✅ Gửi ngay</button>
            <button class="btn-modal-cancel" onclick="document.getElementById('crisisDraftPanel').style.display='none'">Đóng</button>
          </div>
        </div>`;
        panel.scrollIntoView({behavior:'smooth', block:'nearest'});
      }
    }
    return;
  }

  // Crisis banner click → navigate to crisis center
  if (target.classList.contains('btn-crisis-view')) {
    currentCrisisId = target.dataset.crisis || 'cr-001';
    navigate('crisis-center');
    return;
  }

  // Crisis tab selector
  if (target.dataset.crisisid && !target.dataset.actid) {
    currentCrisisId = target.dataset.crisisid;
    navigate('crisis-center');
    return;
  }

}

/* =====================================================================
   7. INIT
   ===================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initEvents();
  navigate('dashboard');

  // Listen for change events on selects
  document.body.addEventListener('change', (e) => {
    if (e.target.id === 'compProductSelect') {
      currentCompetitorProduct = e.target.value;
      navigate('competitor');
    }
  });

  // Welcome toast
  setTimeout(() => {
    showToast('Chào mừng đến với Agicom v2.0! AI Agent đang phân tích shop của bạn...', 'success');
  }, 500);
});
