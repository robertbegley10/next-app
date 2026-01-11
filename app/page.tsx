import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Welcome</h1>
      <div className="flex flex-col md:flex-row gap-6 justify-center max-w-6xl mx-auto">
        <div className="card bg-base-100 w-full md:w-96 shadow-lg">
          <div className="card-body p-6">
            <h2 className="card-title mb-2">Shop Products</h2>
            <p className="mb-4">Browse and purchase our amazing products</p>
            <div className="card-actions justify-end">
              <Link href="/products" className="btn btn-primary">View Products</Link>
            </div>
          </div>
        </div>
        
        <div className="card bg-base-100 w-full md:w-96 shadow-lg">
          <div className="card-body p-6">
            <h2 className="card-title mb-2">Order Management Console</h2>
            <p className="mb-4">View order status</p>
            <div className="card-actions justify-end">
              <Link href="/orders" className="btn btn-secondary">View Orders</Link>
            </div>
          </div>
        </div>
        
        <div className="card bg-base-100 w-full md:w-96 shadow-lg">
          <div className="card-body p-6">
            <h2 className="card-title mb-2">Withdrawals</h2>
            <p className="mb-4">View payout status and withdrawals</p>
            <div className="card-actions justify-end">
              <Link href="/withdrawals" className="btn btn-accent">View Withdrawals</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
