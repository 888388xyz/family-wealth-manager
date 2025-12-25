"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    generate2FASecretAction,
    enable2FAAction,
    disable2FAAction,
    get2FAStatusAction,
} from "@/actions/settings-actions"
import { Shield, ShieldCheck, ShieldOff, Loader2 } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"

interface TwoFactorSetupProps {
    initialEnabled?: boolean
}

type SetupStep = "idle" | "loading" | "setup" | "verify"

export function TwoFactorSetup({ initialEnabled = false }: TwoFactorSetupProps) {
    const [isEnabled, setIsEnabled] = useState(initialEnabled)
    const [step, setStep] = useState<SetupStep>("idle")
    const [secret, setSecret] = useState<string>("")
    const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
    const [verifyCode, setVerifyCode] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    
    // Disable 2FA dialog state
    const [showDisableDialog, setShowDisableDialog] = useState(false)
    const [disablePassword, setDisablePassword] = useState("")
    const [disableError, setDisableError] = useState<string | null>(null)
    const [isDisabling, setIsDisabling] = useState(false)

    // Fetch 2FA status on mount
    useEffect(() => {
        async function fetchStatus() {
            const result = await get2FAStatusAction()
            setIsEnabled(result.enabled)
        }
        fetchStatus()
    }, [])

    // Start 2FA setup - generate secret and QR code
    async function handleStartSetup() {
        setStep("loading")
        setError(null)
        
        const result = await generate2FASecretAction()
        
        if ("error" in result) {
            setError(result.error)
            setStep("idle")
            return
        }
        
        setSecret(result.secret)
        setQrCodeUrl(result.qrCodeUrl)
        setStep("setup")
    }

    // Verify TOTP code and enable 2FA
    async function handleVerifyAndEnable() {
        if (!verifyCode || verifyCode.length !== 6) {
            setError("请输入6位验证码")
            return
        }
        
        setIsProcessing(true)
        setError(null)
        
        const result = await enable2FAAction(verifyCode)
        
        setIsProcessing(false)
        
        if ("error" in result) {
            setError(result.error)
            return
        }
        
        // Success - reset state and update status
        setIsEnabled(true)
        setStep("idle")
        setSecret("")
        setQrCodeUrl("")
        setVerifyCode("")
    }

    // Cancel setup
    function handleCancelSetup() {
        setStep("idle")
        setSecret("")
        setQrCodeUrl("")
        setVerifyCode("")
        setError(null)
    }

    // Open disable dialog
    function handleOpenDisableDialog() {
        setShowDisableDialog(true)
        setDisablePassword("")
        setDisableError(null)
    }

    // Disable 2FA
    async function handleDisable2FA() {
        if (!disablePassword) {
            setDisableError("请输入密码")
            return
        }
        
        setIsDisabling(true)
        setDisableError(null)
        
        const result = await disable2FAAction(disablePassword)
        
        setIsDisabling(false)
        
        if ("error" in result) {
            setDisableError(result.error)
            return
        }
        
        // Success
        setIsEnabled(false)
        setShowDisableDialog(false)
        setDisablePassword("")
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        两步验证
                    </CardTitle>
                    <CardDescription>
                        使用身份验证器应用增强账户安全性
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Current Status */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">当前状态：</span>
                            {isEnabled ? (
                                <Badge variant="default" className="bg-green-600">
                                    <ShieldCheck className="mr-1 h-3 w-3" />
                                    已启用
                                </Badge>
                            ) : (
                                <Badge variant="secondary">
                                    <ShieldOff className="mr-1 h-3 w-3" />
                                    未启用
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Idle State - Show enable/disable button */}
                    {step === "idle" && (
                        <div>
                            {isEnabled ? (
                                <Button 
                                    variant="destructive" 
                                    onClick={handleOpenDisableDialog}
                                >
                                    禁用两步验证
                                </Button>
                            ) : (
                                <Button onClick={handleStartSetup}>
                                    启用两步验证
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Loading State */}
                    {step === "loading" && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            正在生成...
                        </div>
                    )}

                    {/* Setup State - Show QR Code */}
                    {step === "setup" && (
                        <div className="space-y-4">
                            <div className="rounded-lg border p-4 bg-muted/50">
                                <h4 className="font-medium mb-2">步骤 1：扫描二维码</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    使用身份验证器应用（如 Google Authenticator、Microsoft Authenticator）扫描下方二维码
                                </p>
                                <div className="flex justify-center p-4 bg-white rounded-lg">
                                    <QRCodeSVG value={qrCodeUrl} size={200} />
                                </div>
                                <div className="mt-4">
                                    <p className="text-xs text-muted-foreground mb-1">
                                        无法扫描？手动输入密钥：
                                    </p>
                                    <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                                        {secret}
                                    </code>
                                </div>
                            </div>
                            
                            <Button onClick={() => setStep("verify")} className="w-full">
                                下一步：验证
                            </Button>
                            <Button variant="ghost" onClick={handleCancelSetup} className="w-full">
                                取消
                            </Button>
                        </div>
                    )}

                    {/* Verify State - Enter TOTP code */}
                    {step === "verify" && (
                        <div className="space-y-4">
                            <div className="rounded-lg border p-4 bg-muted/50">
                                <h4 className="font-medium mb-2">步骤 2：输入验证码</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    输入身份验证器应用显示的 6 位验证码
                                </p>
                                <div className="space-y-2">
                                    <Label htmlFor="totp-code">验证码</Label>
                                    <Input
                                        id="totp-code"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={6}
                                        placeholder="000000"
                                        value={verifyCode}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, "")
                                            setVerifyCode(value)
                                        }}
                                        className="text-center text-2xl tracking-widest"
                                    />
                                </div>
                            </div>
                            
                            {error && (
                                <p className="text-destructive text-sm">{error}</p>
                            )}
                            
                            <Button 
                                onClick={handleVerifyAndEnable} 
                                disabled={isProcessing || verifyCode.length !== 6}
                                className="w-full"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        验证中...
                                    </>
                                ) : (
                                    "验证并启用"
                                )}
                            </Button>
                            <Button 
                                variant="ghost" 
                                onClick={() => setStep("setup")} 
                                className="w-full"
                            >
                                返回上一步
                            </Button>
                        </div>
                    )}

                    {/* Error display for idle state */}
                    {step === "idle" && error && (
                        <p className="text-destructive text-sm">{error}</p>
                    )}
                </CardContent>
            </Card>

            {/* Disable 2FA Dialog */}
            <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>禁用两步验证</DialogTitle>
                        <DialogDescription>
                            禁用两步验证后，登录时将不再需要验证码。请输入密码确认此操作。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="disable-password">当前密码</Label>
                            <Input
                                id="disable-password"
                                type="password"
                                value={disablePassword}
                                onChange={(e) => setDisablePassword(e.target.value)}
                                placeholder="输入您的密码"
                            />
                        </div>
                        {disableError && (
                            <p className="text-destructive text-sm">{disableError}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setShowDisableDialog(false)}
                            disabled={isDisabling}
                        >
                            取消
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDisable2FA}
                            disabled={isDisabling || !disablePassword}
                        >
                            {isDisabling ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    处理中...
                                </>
                            ) : (
                                "确认禁用"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
