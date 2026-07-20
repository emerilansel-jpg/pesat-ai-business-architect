import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

interface BrandContextValue {
  brandName: string | null;
  setBrandName: (name: string | null) => void;
}

const BrandContext = createContext<BrandContextValue>({
  brandName: null,
  setBrandName: () => {},
});

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brandName, setBrandName] = useState<string | null>(null);

  const updateBrandName = useCallback((name: string | null) => {
    if (!name) return;
    const clean = name.trim().slice(0, 20);
    if (clean) setBrandName(clean);
  }, []);

  return (
    <BrandContext.Provider value={{ brandName, setBrandName: updateBrandName }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}

export default BrandContext;
