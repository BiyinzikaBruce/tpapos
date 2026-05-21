"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Search, ShoppingCart, Trash2, Plus, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatUGX } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  imageUrl: string | null;
  price: number;
  unit: string;
  stock: number;
  category: { id: string; name: string };
};

type CartItem = { product: Product; quantity: number };

type Category = { id: string; name: string };

interface POSScreenProps {
  organisationId: string;
  branchId: string;
  cashierName: string;
  initialProducts: Product[];
  initialCategories: Category[];
}

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "MTN_MOMO", label: "MTN MoMo" },
  { value: "AIRTEL_MONEY", label: "Airtel Money" },
] as const;

export function POSScreen({
  branchId,
  initialProducts,
  initialCategories,
}: POSScreenProps) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "MTN_MOMO" | "AIRTEL_MONEY">("CASH");
  const [discount, setDiscount] = useState<number>(0);
  const [isPending, setIsPending] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return initialProducts.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q);
      const matchesCat = selectedCat === "all" || p.category.id === selectedCat;
      return matchesSearch && matchesCat;
    });
  }, [initialProducts, search, selectedCat]);

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  function addToCart(product: Product) {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Only ${product.stock} in stock`);
          return prev;
        }
        return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev.flatMap((i) => {
        if (i.product.id !== productId) return [i];
        const newQty = i.quantity + delta;
        if (newQty <= 0) return [];
        if (newQty > i.product.stock) {
          toast.error(`Only ${i.product.stock} in stock`);
          return [i];
        }
        return [{ ...i, quantity: newQty }];
      })
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  async function completeSale() {
    if (!cart.length) return toast.error("Cart is empty");
    setIsPending(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          paymentMethod,
          discount,
          items: cart.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
            unitPrice: i.product.price,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Sale failed");
      }
      toast.success(`Sale of ${formatUGX(total)} completed!`);
      setCart([]);
      setDiscount(0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sale failed");
    } finally {
      setIsPending(false);
    }
  }

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const inCart = (id: string) => cart.find((i) => i.product.id === id);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Left: Product Grid ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search + Filter */}
        <div className="px-5 pt-5 pb-3 space-y-3 border-b" style={{ borderColor: "var(--color-border-subtle)" }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5A7A]" />
            <Input
              placeholder="Search products or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#5C5A7A] focus-visible:ring-[#7C3AED]"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCat("all")}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0",
                selectedCat === "all"
                  ? "bg-[#7C3AED] text-white"
                  : "bg-[#12122A] text-[#A09EC0] hover:text-[#F1F0FF] border border-[#2A2A45]"
              )}
            >
              All
            </button>
            {initialCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0",
                  selectedCat === cat.id
                    ? "bg-[#7C3AED] text-white"
                    : "bg-[#12122A] text-[#A09EC0] hover:text-[#F1F0FF] border border-[#2A2A45]"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-[#5C5A7A]">
              <ShoppingCart className="w-10 h-10 mb-3 opacity-40" />
              <p>No products found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map((product) => {
                const cartItem = inCart(product.id);
                const outOfStock = product.stock <= 0;
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    disabled={outOfStock}
                    className={cn(
                      "group relative flex flex-col p-3 rounded-xl border text-left transition-all",
                      outOfStock
                        ? "opacity-50 cursor-not-allowed border-[#1E1E35] bg-[#0D0D1A]"
                        : cartItem
                        ? "border-[#7C3AED] bg-[#12122A] shadow-[0_0_12px_rgba(124,58,237,0.2)]"
                        : "border-[#1E1E35] bg-[#0D0D1A] hover:border-[#7C3AED]/50 hover:bg-[#12122A]"
                    )}
                  >
                    {/* Product image or placeholder */}
                    <div
                      className="w-full aspect-square rounded-lg mb-2 flex items-center justify-center text-2xl font-bold text-[#3A3A60]"
                      style={{ background: "var(--color-bg-elevated)" }}
                    >
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        product.name.charAt(0)
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#F1F0FF] leading-tight line-clamp-2">{product.name}</p>
                    {product.sku && <p className="text-[10px] text-[#5C5A7A] mt-0.5">{product.sku}</p>}
                    <p className="text-sm font-bold text-[#7C3AED] mt-1">{formatUGX(product.price)}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={cn("text-[10px]", product.stock <= 5 ? "text-[#F43F5E]" : "text-[#5C5A7A]")}>
                        Stk: {product.stock}
                      </span>
                      {cartItem && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-[#7C3AED] text-white border-0">
                          {cartItem.quantity}
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Cart ── */}
      <div
        className="w-[360px] flex flex-col border-l"
        style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-bg-elevated)" }}
      >
        {/* Cart Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: "var(--color-border-subtle)" }}>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-[#7C3AED]" />
            <span className="font-semibold text-[#F1F0FF]">Cart</span>
            {cartCount > 0 && (
              <Badge className="bg-[#7C3AED] text-white border-0 text-xs">{cartCount}</Badge>
            )}
          </div>
          {cart.length > 0 && (
            <button onClick={() => { setCart([]); setDiscount(0); }} className="text-[#5C5A7A] hover:text-[#F43F5E] transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-[#5C5A7A]">
              <ShoppingCart className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Add products to cart</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-[#0D0D1A] border border-[#1E1E35]">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#F1F0FF] line-clamp-1">{item.product.name}</p>
                  <p className="text-xs text-[#A09EC0] mt-0.5">{formatUGX(item.product.price)} × {item.quantity}</p>
                  <p className="text-xs font-semibold text-[#7C3AED] mt-0.5">{formatUGX(item.product.price * item.quantity)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <button onClick={() => removeFromCart(item.product.id)} className="text-[#3A3A60] hover:text-[#F43F5E] transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.product.id, -1)} className="w-5 h-5 rounded bg-[#1E1E35] flex items-center justify-center hover:bg-[#7C3AED] transition-colors">
                      <Minus className="w-2.5 h-2.5 text-[#F1F0FF]" />
                    </button>
                    <span className="text-xs font-bold text-[#F1F0FF] w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.product.id, 1)} className="w-5 h-5 rounded bg-[#1E1E35] flex items-center justify-center hover:bg-[#7C3AED] transition-colors">
                      <Plus className="w-2.5 h-2.5 text-[#F1F0FF]" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals + Payment */}
        <div className="px-4 py-4 space-y-3 border-t" style={{ borderColor: "var(--color-border-subtle)" }}>
          <div className="flex justify-between text-sm text-[#A09EC0]">
            <span>Subtotal</span>
            <span className="font-medium text-[#F1F0FF]">{formatUGX(subtotal)}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#A09EC0] flex-shrink-0">Discount (UGX)</label>
            <Input
              type="number"
              min={0}
              value={discount || ""}
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
              placeholder="0"
              className="h-7 text-xs bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] text-right"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-[#F1F0FF]">Total</span>
            <span className="text-xl font-bold text-[#7C3AED]">{formatUGX(total)}</span>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-3 gap-1.5">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setPaymentMethod(m.value)}
                className={cn(
                  "py-1.5 px-2 rounded-lg text-xs font-medium transition-colors border",
                  paymentMethod === m.value
                    ? "bg-[#7C3AED] text-white border-[#7C3AED]"
                    : "bg-[#0D0D1A] text-[#A09EC0] border-[#2A2A45] hover:border-[#7C3AED]/50"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          <Button
            onClick={completeSale}
            disabled={cart.length === 0 || isPending}
            className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold h-11 text-sm disabled:opacity-50"
          >
            {isPending ? "Processing..." : "Complete Sale"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function POSScreenSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 p-5 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-7 w-20 rounded-full" />)}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[...Array(12)].map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-xl" />)}
        </div>
      </div>
      <div className="w-[360px] border-l border-[#1E1E35] p-4 space-y-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
