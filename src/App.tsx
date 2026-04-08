import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Truck, 
  AlertTriangle, 
  Plus, 
  LogOut, 
  ChevronRight, 
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  MapPin,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User, Product, InventoryItem, Transfer } from './types';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Login/Signup State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Data State
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, activeTab]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Auth check failed', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [invRes, prodRes, agentRes, transRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/products'),
        fetch('/api/agents'),
        fetch('/api/transfers')
      ]);

      if (invRes.ok) setInventory(await invRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (agentRes.ok) setAgents(await agentRes.json());
      if (transRes.ok) setTransfers(await transRes.json());
    } catch (err) {
      console.error('Data fetch failed', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setAuthError('Invalid email or password');
      }
    } catch (err) {
      setAuthError('An error occurred. Please try again.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
              <Truck className="w-10 h-10 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">LogiTrack Nigeria</h1>
            <p className="text-slate-500 text-center mt-2">
              Inventory & Delivery Management System
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                placeholder="email@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            <button 
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded-lg transition-colors shadow-lg shadow-orange-200"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Authorized Administrator Only<br/>
              <span className="text-xs text-slate-400">akinyeleawwal@gmail.com</span>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        "bg-slate-900 text-white transition-all duration-300 flex flex-col fixed inset-y-0 z-50",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <Truck className="w-8 h-8 text-orange-500 shrink-0" />
          {isSidebarOpen && <span className="font-bold text-xl tracking-tight">LogiTrack</span>}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            collapsed={!isSidebarOpen}
          />
          <SidebarItem 
            icon={<Package size={20} />} 
            label="Inventory" 
            active={activeTab === 'inventory'} 
            onClick={() => setActiveTab('inventory')}
            collapsed={!isSidebarOpen}
          />
          {user.role === 'admin' && (
            <SidebarItem 
              icon={<Plus size={20} />} 
              label="Products" 
              active={activeTab === 'products'} 
              onClick={() => setActiveTab('products')}
              collapsed={!isSidebarOpen}
            />
          )}
          <SidebarItem 
            icon={<ArrowRightLeft size={20} />} 
            label="Waybills" 
            active={activeTab === 'transfers'} 
            onClick={() => setActiveTab('transfers')}
            collapsed={!isSidebarOpen}
          />
          {user.role === 'admin' && (
            <SidebarItem 
              icon={<Users size={20} />} 
              label="Agents" 
              active={activeTab === 'agents'} 
              onClick={() => setActiveTab('agents')}
              collapsed={!isSidebarOpen}
            />
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 min-h-screen flex flex-col",
        isSidebarOpen ? "ml-64" : "ml-20"
      )}>
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="text-lg font-semibold text-slate-800 capitalize">{activeTab}</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.role === 'admin' ? 'Super Admin' : `Agent - ${user.state}`}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-700 font-bold">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <DashboardView user={user} inventory={inventory} transfers={transfers} />}
              {activeTab === 'inventory' && <InventoryView user={user} inventory={inventory} />}
              {activeTab === 'products' && <ProductsView products={products} onUpdate={fetchData} />}
              {activeTab === 'transfers' && <TransfersView user={user} transfers={transfers} agents={agents} products={products} onUpdate={fetchData} />}
              {activeTab === 'agents' && <AgentsView agents={agents} inventory={inventory} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// --- Sub-Components ---

function SidebarItem({ icon, label, active, onClick, collapsed }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void, collapsed: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group",
        active ? "bg-orange-600 text-white shadow-lg shadow-orange-900/20" : "text-slate-400 hover:text-white hover:bg-slate-800"
      )}
    >
      <span className={cn("shrink-0", active ? "text-white" : "group-hover:text-orange-400")}>{icon}</span>
      {!collapsed && <span className="font-medium">{label}</span>}
    </button>
  );
}

function StatCard({ title, value, icon, color, subtitle }: { title: string, value: string | number, icon: React.ReactNode, color: string, subtitle?: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-1">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={cn("p-3 rounded-xl", color)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function DashboardView({ user, inventory, transfers }: { user: User, inventory: InventoryItem[], transfers: Transfer[] }) {
  const lowStockItems = inventory.filter(i => i.quantity <= 3);
  const pendingTransfers = transfers.filter(t => t.status === 'Pending');
  const totalStock = inventory.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Stock" 
          value={totalStock} 
          icon={<Package className="text-blue-600" />} 
          color="bg-blue-50" 
          subtitle="Across all agents"
        />
        <StatCard 
          title="Low Stock Alerts" 
          value={lowStockItems.length} 
          icon={<AlertTriangle className="text-red-600" />} 
          color="bg-red-50" 
          subtitle="Items with ≤ 3 units"
        />
        <StatCard 
          title="Pending Waybills" 
          value={pendingTransfers.length} 
          icon={<Clock className="text-orange-600" />} 
          color="bg-orange-50" 
          subtitle="Awaiting confirmation"
        />
        <StatCard 
          title="Total Transfers" 
          value={transfers.length} 
          icon={<Truck className="text-green-600" />} 
          color="bg-green-50" 
          subtitle="Historical data"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} />
              Critical Low Stock
            </h3>
            <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded-full">
              Action Required
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {lowStockItems.length > 0 ? lowStockItems.map((item, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold">
                    {item.product?.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{item.product?.name}</p>
                    <p className="text-xs text-slate-500">{item.agent?.name} ({item.agent?.state})</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">{item.quantity}</p>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-red-400">Units Left</p>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-slate-400">
                <CheckCircle2 className="mx-auto mb-2 text-green-500" size={32} />
                <p>All stock levels are healthy</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transfers */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <ArrowRightLeft className="text-orange-500" size={20} />
              Recent Waybills
            </h3>
          </div>
          <div className="divide-y divide-slate-50">
            {transfers.slice(0, 5).map((t, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    t.status === 'Delivered' ? "bg-green-500" : "bg-orange-500 animate-pulse"
                  )} />
                  <div>
                    <p className="font-semibold text-slate-800">{t.product?.name}</p>
                    <p className="text-xs text-slate-500">
                      {t.sourceAgent?.state} → {t.destinationAgent?.state}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-700">{t.quantity} units</p>
                  <p className={cn(
                    "text-[10px] font-bold uppercase",
                    t.status === 'Delivered' ? "text-green-600" : "text-orange-600"
                  )}>{t.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InventoryView({ user, inventory }: { user: User, inventory: InventoryItem[] }) {
  const [search, setSearch] = useState('');
  
  const filtered = inventory.filter(i => 
    i.product?.name.toLowerCase().includes(search.toLowerCase()) ||
    i.product?.sku.toLowerCase().includes(search.toLowerCase()) ||
    i.agent?.state.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by product, SKU or state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50">
            <Filter size={18} />
            Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">SKU</th>
              {user.role === 'admin' && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>}
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Level</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold text-xs">
                      {item.product?.name.charAt(0)}
                    </div>
                    <span className="font-medium text-slate-900">{item.product?.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 font-mono">{item.product?.sku}</td>
                {user.role === 'admin' && (
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <MapPin size={14} className="text-slate-400" />
                      {item.agent?.state}
                    </div>
                  </td>
                )}
                <td className="px-6 py-4">
                  <span className={cn(
                    "font-bold text-lg",
                    item.quantity <= 3 ? "text-red-600" : "text-slate-900"
                  )}>
                    {item.quantity}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {item.quantity <= 3 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      <AlertTriangle size={12} />
                      Low Stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                      <CheckCircle2 size={12} />
                      Healthy
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductsView({ products, onUpdate }: { products: Product[], onUpdate: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', sku: '', category: '', description: '', initialQuantity: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      onUpdate();
      setIsModalOpen(false);
      setFormData({ name: '', sku: '', category: '', description: '', initialQuantity: 0 });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800">Product Catalog</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-lg shadow-orange-200"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold text-xl group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                {product.name.charAt(0)}
              </div>
              <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg uppercase tracking-wider">
                {product.category}
              </span>
            </div>
            <h4 className="text-lg font-bold text-slate-900">{product.name}</h4>
            <p className="text-sm text-slate-500 mt-1 font-mono">{product.sku}</p>
            <p className="text-sm text-slate-600 mt-4 line-clamp-2">{product.description}</p>
            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
              <button className="text-orange-600 font-semibold text-sm hover:underline">Edit Details</button>
              <ChevronRight size={18} className="text-slate-300" />
            </div>
          </div>
        ))}
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Add New Product</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="e.g. iPhone 15 Pro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                  <input 
                    type="text" 
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="IP15P-128"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input 
                    type="text" 
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Electronics"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Initial Quantity (Lagos Hub)</label>
                  <input 
                    type="number" 
                    required
                    value={formData.initialQuantity}
                    onChange={(e) => setFormData({...formData, initialQuantity: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea 
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl mt-4 transition-all shadow-lg shadow-orange-200"
              >
                Create Product
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function TransfersView({ user, transfers, agents, products, onUpdate }: { user: User, transfers: Transfer[], agents: User[], products: Product[], onUpdate: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ sourceAgentId: '1', destinationAgentId: '', productId: '', quantity: 1 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      onUpdate();
      setIsModalOpen(false);
    }
  };

  const handleConfirm = async (id: string) => {
    const res = await fetch(`/api/transfers/${id}/confirm`, { method: 'POST' });
    if (res.ok) onUpdate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800">Waybill Management</h3>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold transition-all shadow-lg shadow-orange-200"
        >
          <Plus size={20} />
          Create Waybill
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Waybill ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Route</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Qty</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {transfers.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-slate-500">#{t.id}</td>
                <td className="px-6 py-4">
                  <span className="font-medium text-slate-900">{t.product?.name}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="font-bold">{t.sourceAgent?.state}</span>
                    <ArrowRightLeft size={12} className="text-slate-400" />
                    <span className="font-bold">{t.destinationAgent?.state}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-slate-700">{t.quantity}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold",
                    t.status === 'Delivered' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                  )}>
                    {t.status === 'Delivered' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                    {t.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {t.status === 'Pending' && (user.id === t.destinationAgentId || user.role === 'admin') && (
                    <button 
                      onClick={() => handleConfirm(t.id)}
                      className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg text-xs font-bold transition-all"
                    >
                      Confirm Receipt
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Waybill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Create New Waybill</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Source Agent</label>
                <select 
                  value={formData.sourceAgentId}
                  onChange={(e) => setFormData({...formData, sourceAgentId: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                >
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.state})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Destination Agent</label>
                <select 
                  required
                  value={formData.destinationAgentId}
                  onChange={(e) => setFormData({...formData, destinationAgentId: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                >
                  <option value="">Select Destination</option>
                  {agents.filter(a => a.id !== formData.sourceAgentId).map(a => <option key={a.id} value={a.id}>{a.name} ({a.state})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
                <select 
                  required
                  value={formData.productId}
                  onChange={(e) => setFormData({...formData, productId: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                >
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl mt-4 transition-all shadow-lg shadow-orange-200"
              >
                Initiate Transfer
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function AgentsView({ agents, inventory }: { agents: User[], inventory: InventoryItem[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800">Delivery Agents</h3>
        <button className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold transition-all">
          <Plus size={20} />
          Register Agent
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const agentStock = inventory.filter(i => i.agentId === agent.id);
          const totalUnits = agentStock.reduce((acc, curr) => acc + curr.quantity, 0);
          const lowStockCount = agentStock.filter(i => i.quantity <= 3).length;

          return (
            <div key={agent.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900 font-bold border border-slate-200">
                  {agent.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{agent.name}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin size={12} />
                    {agent.state}, Nigeria
                  </p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Total Stock</span>
                  <span className="font-bold text-slate-900">{totalUnits} units</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Low Stock Alerts</span>
                  <span className={cn(
                    "font-bold px-2 py-0.5 rounded-lg text-xs",
                    lowStockCount > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  )}>
                    {lowStockCount} items
                  </span>
                </div>
                <div className="pt-4 border-t border-slate-50">
                  <button className="w-full py-2 text-sm font-bold text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                    View Full Inventory
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
