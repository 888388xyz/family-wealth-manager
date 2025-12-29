import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { DynamicBreadcrumb } from "@/components/ui/dynamic-breadcrumb"
import { getCurrentUserAction } from "@/actions/settings-actions"
import { NotificationBell } from "@/components/notifications"
import { redirect } from "next/navigation"
import packageJson from "../../../package.json"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentUserAction()
    
    // 未登录用户重定向到登录页面
    if (!user) {
        redirect("/login")
    }
    
    const version = packageJson.version

    return (
        <SidebarProvider>
            <AppSidebar 
                userRole={user?.role} 
                userName={user?.name}
                userEmail={user?.email}
                version={version}
            />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <DynamicBreadcrumb />
                    <div className="ml-auto">
                        <NotificationBell />
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
