// frontend/src/app/admin/layout.tsx
import AdminHeader from "../../components/AdminHeader";
import Footer from "../../components/Footer";

// This layout wraps all pages inside the /admin directory
export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <AdminHeader />
            <main className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}