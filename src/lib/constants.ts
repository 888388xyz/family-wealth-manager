// 银行列表
export const BANKS = [
    { value: "ICBC", label: "工商银行" },
    { value: "CCB", label: "建设银行" },
    { value: "ABC", label: "农业银行" },
    { value: "BOC", label: "中国银行" },
    { value: "CMB", label: "招商银行" },
    { value: "CITIC", label: "中信银行" },
    { value: "SPDB", label: "浦发银行" },
    { value: "CEB", label: "光大银行" },
    { value: "PAB", label: "平安银行" },
    { value: "CMBC", label: "民生银行" },
    { value: "CIB", label: "兴业银行" },
    { value: "HXB", label: "华夏银行" },
    { value: "PSBC", label: "邮储银行" },
    { value: "ALIPAY", label: "支付宝" },
    { value: "WECHAT", label: "微信钱包" },
    { value: "OTHER", label: "其他" },
] as const

// 账户类型
export const ACCOUNT_TYPES = [
    { value: "CHECKING", label: "活期" },
    { value: "SAVINGS", label: "定期" },
    { value: "MONEY_MARKET", label: "货币基金" },
    { value: "CREDIT", label: "信用卡" },
    { value: "WEALTH", label: "理财产品" },
    { value: "OTHER", label: "其他" },
] as const
