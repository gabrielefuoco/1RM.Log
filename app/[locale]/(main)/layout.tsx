import { MobileNav } from "@/components/nav/mobile-bar"
import { TopHeader } from "@/components/nav/top-header"
import { DesktopSidebar } from "@/components/nav/desktop-sidebar"

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col bg-background pb-32 lg:pb-0">
            {/* Desktop Sidebar (Left) */}
            <DesktopSidebar />

            <div className="flex-1 flex flex-col lg:pl-72 transition-all duration-300">
                {/* Top Header - Adjusted for desktop transparency/width if needed */}
                <TopHeader />

                {/* Main Content Area - Centered max width on desktop */}
                <main className="flex-1 px-4 lg:px-8 w-full">
                    {children}
                </main>
            </div>

            {/* Mobile Nav (Bottom) - Hidden on lg screens */}
            <div className="lg:hidden">
                <MobileNav />
            </div>
        </div>
    )
}
