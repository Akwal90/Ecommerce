import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('CRITICAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.');
}

// Initialize Supabase with Service Role Key for server-side operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());
app.use(cors());

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Forbidden' });
    req.user = user;
    next();
  });
};

// API Routes
app.post('/api/auth/bootstrap', async (req, res) => {
    const { secret } = req.body;
    if (secret !== 'logitrack-init-2026') {
      return res.status(403).json({ message: 'Invalid bootstrap secret' });
    }

    const email = 'akinyeleawwal@gmail.com';
    const password_hash = await bcrypt.hash('admin123', 10);

    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return res.json({ message: 'Admin account already exists' });
    }

    const { error } = await supabase
      .from('profiles')
      .insert([{
        email,
        password_hash,
        name: 'Super Admin',
        state: 'Lagos',
        role: 'admin'
      }]);

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    res.json({ message: 'Admin account created successfully. Default password is: admin123' });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Database error during login:', error);
      return res.status(500).json({ message: 'Database connection error' });
    }

    if (!user) {
      console.log(`Login attempt failed: User ${email} not found`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.log(`Login attempt failed: Incorrect password for ${email}`);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Strictly allow only the authorized email to log in
    if (user.email !== 'akinyeleawwal@gmail.com') {
      return res.status(403).json({ message: 'Access restricted to the authorized administrator only.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, state: user.state, name: user.name }, JWT_SECRET);
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    res.json({ user: { id: user.id, email: user.email, role: user.role, state: user.state, name: user.name } });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
  });

  app.get('/api/auth/me', (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(401).json({ message: 'Unauthorized' });
      res.json({ user });
    });
  });

  // Inventory Routes
  app.get('/api/inventory', authenticateToken, async (req, res) => {
    const user = (req as any).user;
    
    let query = supabase
      .from('inventory')
      .select(`
        *,
        product:products(*),
        agent:profiles(*)
      `);

    if (user.role === 'agent') {
      query = query.eq('agent_id', user.id);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    
    // Map snake_case to camelCase for frontend compatibility
    const mappedData = data.map(item => ({
      agentId: item.agent_id,
      productId: item.product_id,
      quantity: item.quantity,
      product: item.product,
      agent: item.agent
    }));

    res.json(mappedData);
  });

  app.get('/api/products', authenticateToken, async (req, res) => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.post('/api/products', authenticateToken, async (req, res) => {
    if ((req as any).user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    
    const { name, sku, category, description, initialQuantity } = req.body;
    
    const { data: product, error: prodError } = await supabase
      .from('products')
      .insert([{ name, sku, category, description }])
      .select()
      .single();

    if (prodError) return res.status(500).json({ error: prodError.message });

    // Initialize inventory for Lagos agent (ID '1' assumed for Lagos)
    await supabase.from('inventory').insert([{ agent_id: '1', product_id: product.id, quantity: initialQuantity || 0 }]);
    
    res.json(product);
  });

  app.get('/api/agents', authenticateToken, async (req, res) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or('role.eq.agent,id.eq.1');
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Transfer Routes
  app.post('/api/transfers', authenticateToken, async (req, res) => {
    const { sourceAgentId, destinationAgentId, productId, quantity } = req.body;
    const user = (req as any).user;

    if (user.role !== 'admin' && user.id !== sourceAgentId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Check source stock
    const { data: sourceInv, error: invError } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('agent_id', sourceAgentId)
      .eq('product_id', productId)
      .single();

    if (invError || !sourceInv || sourceInv.quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Create transfer
    const { data: transfer, error: transError } = await supabase
      .from('transfers')
      .insert([{
        source_agent_id: sourceAgentId,
        destination_agent_id: destinationAgentId,
        product_id: productId,
        quantity,
        status: 'Pending'
      }])
      .select(`
        *,
        product:products(*),
        sourceAgent:profiles!source_agent_id(*),
        destinationAgent:profiles!destination_agent_id(*)
      `)
      .single();

    if (transError) return res.status(500).json({ error: transError.message });

    // Reduce source stock
    await supabase
      .from('inventory')
      .update({ quantity: sourceInv.quantity - quantity })
      .eq('agent_id', sourceAgentId)
      .eq('product_id', productId);

    res.json(transfer);
  });

  app.get('/api/transfers', authenticateToken, async (req, res) => {
    const user = (req as any).user;
    
    let query = supabase
      .from('transfers')
      .select(`
        *,
        product:products(*),
        sourceAgent:profiles!source_agent_id(*),
        destinationAgent:profiles!destination_agent_id(*)
      `);

    if (user.role === 'agent') {
      query = query.or(`source_agent_id.eq.${user.id},destination_agent_id.eq.${user.id}`);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    
    // Map snake_case to camelCase
    const mappedData = data.map(t => ({
      ...t,
      sourceAgentId: t.source_agent_id,
      destinationAgentId: t.destination_agent_id,
      productId: t.product_id,
      createdAt: t.created_at,
      deliveredAt: t.delivered_at
    }));

    res.json(mappedData);
  });

  app.post('/api/transfers/:id/confirm', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const user = (req as any).user;

    const { data: transfer, error: fetchError } = await supabase
      .from('transfers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !transfer) return res.status(404).json({ message: 'Transfer not found' });
    if (user.id !== transfer.destination_agent_id && user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Update transfer status
    await supabase
      .from('transfers')
      .update({ status: 'Delivered', delivered_at: new Date().toISOString() })
      .eq('id', id);

    // Update destination stock
    const { data: destInv } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('agent_id', transfer.destination_agent_id)
      .eq('product_id', transfer.product_id)
      .single();

    if (destInv) {
      await supabase
        .from('inventory')
        .update({ quantity: destInv.quantity + transfer.quantity })
        .eq('agent_id', transfer.destination_agent_id)
        .eq('product_id', transfer.product_id);
    } else {
      await supabase
        .from('inventory')
        .insert([{ 
          agent_id: transfer.destination_agent_id, 
          product_id: transfer.product_id, 
          quantity: transfer.quantity 
        }]);
    }

  res.json({ success: true });
});

// Vite middleware for development
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
