// frontend/src/app/admin/layout.tsx
import Sidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";
import { ModalProvider } from "../../contexts/ModalContext"; // Import the provider
import { ToastProvider } from "../../contexts/ToastContext"; // Import the provider

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <ModalProvider>
            <ToastProvider>

                <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                    <Sidebar />
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <AdminHeader />
                        <main className="flex-1 overflow-x-hidden overflow-y-auto">
                            <div className="container mx-auto px-6 py-8">
                                {children}
                            </div>
                        </main>
                    </div>
                </div>
            </ToastProvider>
        </ModalProvider>

    );
}