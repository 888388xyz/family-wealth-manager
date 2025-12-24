// 银行/平台列表
export const BANKS = [
    { value: "工商银行", label: "工商银行" },
    { value: "建设银行", label: "建设银行" },
    { value: "农业银行", label: "农业银行" },
    { value: "中国银行", label: "中国银行" },
    { value: "招商银行", label: "招商银行" },
    { value: "中信银行", label: "中信银行" },
    { value: "浦发银行", label: "浦发银行" },
    { value: "光大银行", label: "光大银行" },
    { value: "平安银行", label: "平安银行" },
    { value: "民生银行", label: "民生银行" },
    { value: "兴业银行", label: "兴业银行" },
    { value: "华夏银行", label: "华夏银行" },
    { value: "邮储银行", label: "邮储银行" },
    { value: "汇丰中国", label: "汇丰中国" },
    { value: "汇丰香港", label: "汇丰香港" },
    { value: "汇丰美国", label: "汇丰美国" },
    { value: "京东", label: "京东金融" },
    { value: "博时", label: "博时基金" },
    { value: "支付宝", label: "支付宝" },
    { value: "微信", label: "微信钱包" },
    { value: "股市", label: "股市" },
    { value: "其他", label: "其他" },
] as const

// 产品类型
export const PRODUCT_TYPES = [
    { value: "FUND", label: "基金" },
    { value: "FIXED_DEPOSIT", label: "定期理财" },
    { value: "DEMAND_DEPOSIT", label: "活期存款" },
    { value: "DEMAND_WEALTH", label: "活期理财" },
    { value: "PRECIOUS_METAL", label: "贵金属" },
    { value: "STOCK", label: "股票" },
    { value: "OTHER", label: "其他" },
] as const

// 货币类型
export const CURRENCIES = [
    { value: "CNY", label: "人民币" },
    { value: "USD", label: "美元" },
    { value: "HKD", label: "港币" },
    { value: "EUR", label: "欧元" },
] as const

// 账户类型 (保留用于兼容)
export const ACCOUNT_TYPES = [
    { value: "CHECKING", label: "活期" },
    { value: "SAVINGS", label: "定期" },
    { value: "MONEY_MARKET", label: "货币基金" },
    { value: "CREDIT", label: "信用卡" },
    { value: "WEALTH", label: "理财产品" },
    { value: "OTHER", label: "其他" },
] as const
