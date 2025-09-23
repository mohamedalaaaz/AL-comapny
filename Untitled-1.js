import React, { useState } from "react";

// Single-file React component using Tailwind classes.
// Default export is the App component. This is a fully functional static demo
// of an e‑commerce storefront for handmade candles & concrete décor.

const PRODUCTS = [
  {
    id: 1,
    category: "Candle",
    title: "Linen & Amber Soy Candle",
    price: 24,
    description:
      "A hand-poured soy candle with linen and amber notes. Burn time ~45 hrs.",
    sizes: ["200ml", "400ml"],
    scent: "Linen & Amber",
    image:
      "https://images.unsplash.com/photo-1520962913728-9b3b1d3f8a0d?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=0d6f8f7a9c9a1c9d",
  },
  {
    id: 2,
    category: "Candle",
    title: "Citrus Grove Reed Candle",
    price: 22,
    description: "Bright citrus top notes on clean wax — uplifting and fresh.",
    sizes: ["180ml", "350ml"],
    scent: "Citrus",
    image:
      "https://images.unsplash.com/photo-1517935706615-2717063c2225?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=7d4b4a3f8a3a2e2f",
  },
  {
    id: 3,
    category: "Concrete",
    title: "Minimal Concrete Planter - Pebble",
    price: 38,
    description: "Lightweight cast concrete planter with drainage hole.",
    sizes: ["Small", "Medium", "Large"],
    image:
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=9a9b1b1d5f5f6a6b",
  },
  {
    id: 4,
    category: "Concrete",
    title: "Concrete Candle Holder - Modern Curve",
    price: 30,
    description: "Hand-finished holder that complements our candles perfectly.",
    sizes: ["Single", "Pair"],
    image:
      "https://images.unsplash.com/photo-1526403224743-4f6f8a6f9c66?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=4c4d6e7f8a8b9c9d",
  },
];

function formatCurrency(n) {
  return `$${n.toFixed(2)}`;
}

export default function App() {
  const [route, setRoute] = useState("home");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  const filtered = PRODUCTS.filter((p) => {
    if (categoryFilter !== "All" && p.category !== categoryFilter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.scent && p.scent.toLowerCase().includes(q))
    );
  });

  function addToCart(product, opts = {}) {
    const item = { ...product, opts, qty: 1 };
    setCart((c) => {
      const found = c.find((x) => x.id === item.id && JSON.stringify(x.opts) === JSON.stringify(item.opts));
      if (found) return c.map((x) => (x === found ? { ...x, qty: x.qty + 1 } : x));
      return [...c, item];
    });
    setRoute("cart");
  }

  function updateQty(index, qty) {
    setCart((c) => c.map((it, i) => (i === index ? { ...it, qty } : it)).filter((it) => it.qty > 0));
  }

  function subtotal() {
    return cart.reduce((s, it) => s + it.price * it.qty, 0);
  }

  function checkout(data) {
    // Mock checkout — in a real app you'd send to a backend / payment gateway
    console.log("checkout data", data, cart);
    setCart([]);
    setCheckoutSuccess(true);
    setRoute("home");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-800">
      <header className="max-w-6xl mx-auto p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold">C&amp;C</div>
          <div>
            <h1 className="text-xl font-serif">Candles &amp; Concrete</h1>
            <p className="text-xs text-gray-500">Handcrafted elegance in wax &amp; stone</p>
          </div>
        </div>

        <nav className="flex items-center gap-4">
          <button onClick={() => setRoute("home")} className="text-sm">Home</button>
          <button onClick={() => setRoute("shop")} className="text-sm">Shop</button>
          <button onClick={() => setRoute("about")} className="text-sm">About</button>
          <button onClick={() => setRoute("contact")} className="text-sm">Contact</button>
          <button onClick={() => setRoute("cart")} className="bg-gray-900 text-white px-3 py-1 rounded">Cart ({cart.reduce((s,i)=>s+i.qty,0)})</button>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {route === "home" && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-4xl font-serif mb-4">Handcrafted Elegance in Wax &amp; Stone</h2>
              <p className="text-gray-600 mb-6">Minimal materials. Maximum warmth. Small-batch candles and carefully cast concrete décor designed to make everyday spaces feel special.</p>

              <div className="flex gap-3">
                <button onClick={() => setRoute("shop")} className="px-4 py-2 bg-gray-900 text-white rounded shadow">Shop Collections</button>
                <button onClick={() => setRoute("about")} className="px-4 py-2 border rounded">Our Story</button>
              </div>

              <div className="mt-8">
                <h3 className="font-semibold mb-2">Featured products</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PRODUCTS.slice(0,3).map((p) => (
                    <article key={p.id} className="p-4 border rounded bg-white">
                      <img src={p.image} alt={p.title} className="w-full h-40 object-cover rounded-md mb-3" />
                      <h4 className="font-medium">{p.title}</h4>
                      <p className="text-sm text-gray-500">{formatCurrency(p.price)}</p>
                    </article>
                  ))}
                </div>
              </div>

            </div>

            <div className="rounded-lg overflow-hidden shadow-md">
              <img src="https://images.unsplash.com/photo-1509221964956-ef1ae40f9f55?q=80&w=1400&auto=format&fit=crop&ixlib=rb-4.0.3&s=2d3a4b5c6d7e8f9a" alt="Hero" className="w-full h-full object-cover" />
            </div>

            <div className="md:col-span-2 mt-8">
              <h3 className="font-serif text-2xl mb-4">What customers say</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <blockquote className="p-4 border rounded">"Beautiful scents and the concrete planter is a work of art. Shipping was fast." — Aya</blockquote>
                <blockquote className="p-4 border rounded">"Perfect for gifts. The linen candle smells like home." — Omar</blockquote>
                <blockquote className="p-4 border rounded">"Simple, clean design that fits my living room." — Lina</blockquote>
              </div>
            </div>
          </section>
        )}

        {route === "shop" && (
          <section>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <h2 className="text-2xl font-serif">Shop</h2>
              <div className="flex gap-3 items-center">
                <input type="text" className="px-3 py-2 border rounded" placeholder="Search products..." value={query} onChange={(e) => setQuery(e.target.value)} />
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 border rounded">
                  <option>All</option>
                  <option>Candle</option>
                  <option>Concrete</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((p) => (
                <div key={p.id} className="bg-white rounded shadow p-4 flex flex-col">
                  <img src={p.image} alt={p.title} className="w-full h-44 object-cover rounded mb-3" />
                  <h3 className="font-medium">{p.title}</h3>
                  <p className="text-sm text-gray-500 flex-1">{p.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-lg font-semibold">{formatCurrency(p.price)}</div>
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedProduct(p); setRoute("product"); }} className="px-3 py-1 border rounded">View</button>
                      <button onClick={() => addToCart(p)} className="px-3 py-1 bg-gray-900 text-white rounded">Add</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {route === "product" && selectedProduct && (
          <section className="grid md:grid-cols-2 gap-6">
            <div>
              <img src={selectedProduct.image} alt={selectedProduct.title} className="w-full h-96 object-cover rounded" />
            </div>
            <div>
              <h2 className="text-2xl font-serif mb-2">{selectedProduct.title}</h2>
              <p className="text-gray-600 mb-4">{selectedProduct.description}</p>
              {selectedProduct.scent && <p className="text-sm mb-2"><strong>Scent:</strong> {selectedProduct.scent}</p>}

              <div className="mb-4">
                <label className="block text-sm mb-1">Size / Variant</label>
                <div className="flex gap-2">
                  {selectedProduct.sizes.map((s) => (
                    <button key={s} className="px-3 py-1 border rounded">{s}</button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="text-2xl font-semibold">{formatCurrency(selectedProduct.price)}</div>
                <button onClick={() => addToCart(selectedProduct)} className="px-4 py-2 bg-gray-900 text-white rounded">Add to cart</button>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Reviews</h4>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="p-3 border rounded">"Lovely scent and long lasting." — 5/5</div>
                  <div className="p-3 border rounded">"Perfect size for bedside." — 4/5</div>
                </div>
              </div>

            </div>
          </section>
        )}

        {route === "about" && (
          <section className="prose max-w-none">
            <h2 className="font-serif text-2xl">About Us</h2>
            <p>We are a small studio crafting candles and concrete décor from ethically sourced materials. Every candle is hand-poured in small batches using soy wax and cotton wicks. Our concrete pieces are cast locally and hand-finished to achieve a soft, natural texture.</p>
            <h3 className="mt-4">Sustainability</h3>
            <p>We prioritize recyclable packaging and sustainable wax blends. Our concrete uses low-water casting techniques and locally sourced aggregates.</p>
          </section>
        )}

        {route === "contact" && (
          <section className="max-w-xl">
            <h2 className="font-serif text-2xl mb-4">Contact</h2>
            <form onSubmit={(e) => { e.preventDefault(); alert('Message sent — we will reply to your email.'); }} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input required className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input type="email" required className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm mb-1">Message</label>
                <textarea required className="w-full px-3 py-2 border rounded"></textarea>
              </div>
              <div>
                <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded">Send Message</button>
              </div>
            </form>

            <div className="mt-6">
              <p className="text-sm">Email: hello@candlesandconcrete.example</p>
              <p className="text-sm">Instagram: @candlesandconcrete</p>
            </div>
          </section>
        )}

        {route === "cart" && (
          <section>
            <h2 className="text-2xl font-serif mb-4">Cart</h2>
            {cart.length === 0 ? (
              <div className="p-6 border rounded text-center">Your cart is empty. <button onClick={() => setRoute('shop')} className="ml-2 text-blue-600">Browse products</button></div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  {cart.map((it, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 border rounded mb-3">
                      <img src={it.image} alt={it.title} className="w-20 h-20 object-cover rounded" />
                      <div className="flex-1">
                        <div className="font-medium">{it.title}</div>
                        <div className="text-sm text-gray-500">{formatCurrency(it.price)}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <button onClick={() => updateQty(i, it.qty - 1)} className="px-2 py-1 border rounded">-</button>
                          <div>{it.qty}</div>
                          <button onClick={() => updateQty(i, it.qty + 1)} className="px-2 py-1 border rounded">+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border rounded bg-white">
                  <div className="flex justify-between mb-2"><div>Subtotal</div><div>{formatCurrency(subtotal())}</div></div>
                  <div className="text-sm text-gray-500 mb-4">Shipping calculated at checkout</div>

                  <button onClick={() => setRoute('checkout')} className="w-full px-4 py-2 bg-gray-900 text-white rounded">Proceed to Checkout</button>
                </div>
              </div>
            )}
          </section>
        )}

        {route === "checkout" && (
          <section className="max-w-2xl">
            <h2 className="font-serif text-2xl mb-4">Checkout</h2>
            <CheckoutForm onComplete={checkout} total={subtotal()} />
          </section>
        )}

        {checkoutSuccess && <div className="fixed bottom-6 right-6 p-3 bg-green-100 border rounded">Order placed successfully — check your email for confirmation.</div>}

      </main>

      <footer className="border-t mt-12 py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm">© {new Date().getFullYear()} Candles &amp; Concrete — All rights reserved.</div>
          <div className="flex gap-4 text-sm">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CheckoutForm({ onComplete, total }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState("card");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onComplete({ name, email, address, payment });
      }}
      className="space-y-4 p-4 border rounded bg-white"
    >
      <div>
        <label className="block text-sm mb-1">Full name</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm mb-1">Email</label>
        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded" />
      </div>
      <div>
        <label className="block text-sm mb-1">Shipping address</label>
        <textarea required value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 border rounded" />
      </div>

      <div>
        <label className="block text-sm mb-1">Payment</label>
        <div className="flex gap-2">
          <label className="flex items-center gap-2"><input type="radio" checked={payment === 'card'} onChange={() => setPayment('card')} /> Credit / Debit card</label>
          <label className="flex items-center gap-2"><input type="radio" checked={payment === 'paypal'} onChange={() => setPayment('paypal')} /> PayPal</label>
          <label className="flex items-center gap-2"><input type="radio" checked={payment === 'cod'} onChange={() => setPayment('cod')} /> Cash on Delivery</label>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-lg font-semibold">{formatCurrency(total)}</div>
        </div>
        <button className="px-4 py-2 bg-gray-900 text-white rounded" type="submit">Place order</button>
      </div>
    </form>
  );
}
