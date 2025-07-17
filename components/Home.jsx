import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Navbar */}
            <nav className="bg-green-800 text-white p-4 flex justify-between items-center shadow-md">
                <div className="text-2xl font-bold">John Deere</div>
                <ul className="flex space-x-6">
                    <li><Link href="/products" className="hover:underline">Products</Link></li>
                    <li><Link href="/services" className="hover:underline">Services</Link></li>
                    <li><Link href="/about" className="hover:underline">About Us</Link></li>
                    <li><Link href="/contact" className="hover:underline">Contact</Link></li>
                </ul>
            </nav>

            {/* Hero Section */}
            <header className="relative w-full h-[500px]">
                <Image
                    src="/assets/deer-bg-cover.png"
                    alt="Agriculture Field"
                    layout="fill"
                    objectFit="cover"
                    className="brightness-75"
                />
                <div className="absolute inset-0 flex items-center justify-center text-center text-white">
                    <h1 className="text-4xl md:text-6xl font-bold">Innovation in Agriculture</h1>
                </div>
            </header>

            {/* Content Section */}
            <main className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-100 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold">Tractors</h2>
                    <p className="text-gray-700">Explore our latest models with advanced technology.</p>
                </div>
                <div className="bg-gray-100 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold">Harvesters</h2>
                    <p className="text-gray-700">Efficiency and productivity for your farm.</p>
                </div>
                <div className="bg-gray-100 p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold">Smart Farming</h2>
                    <p className="text-gray-700">Precision agriculture solutions for modern farming.</p>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-green-900 text-white p-6 text-center mt-auto">
                <p>&copy; {new Date().getFullYear()} John Deere. All rights reserved.</p>
            </footer>
        </div>
    );
}
