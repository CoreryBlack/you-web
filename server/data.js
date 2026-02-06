// 共享的内存数据存储，用于示例/开发环境
module.exports = {
  users: [
    { user_id: 'u001', phone: '13888888888', nickname: 'TestUser', status: 1, points: 500, create_time: new Date(), token: null }
  ],
  cards: [
    { card_no: '8000001', user_id: 'u001', balance_cents: 5000, status: 1, create_time: new Date() }
  ],
  staff: [
    // role numeric mapping: 1 = cashier, 2 = station manager, 3 = admin
    { staff_id: 's001', username: 'admin', phone: '17538583203', real_name: 'Administrator', status: 1, role: 3, passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', create_time: new Date(), token: null }
  ],
  stations: [
    { station_id: 'st001', name: '首联石化第一加油站', address: '北京市朝阳区', status: 1, create_time: new Date() }
  ],
  orders: [],
  transactions: [],
  products: [
    { id: 1, name: '矿泉水', points: 100, stock: 99, description: '500ml 饮用天然水' },
    { id: 2, name: '纸巾', points: 50, stock: 200, description: '抽取式面巾纸' }
  ]

  // 全局配置：定价模块，单位：元（浮点数）。
  // 汽油按标号分别定价：92#, 95#, 98#
  // 柴油按标号分别定价：0#, -10#（可扩展）
  ,pricing: {
    gasoline: {
      '92': 7.00,
      '95': 7.60,
      '98': 8.20
    },
    diesel: {
      '0': 6.50,
      '-10': 6.30
    }
  ,
  // 全局积分规则：每 1 元可兑换多少积分（points per yuan）
  pointsPerYuan: 1.0
  }
}
