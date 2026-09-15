import Link from "next/link";
import { Lockup, type Product } from "./Marks";

export type NavLink = { href: string; label: string };

/**
 * Una sola cabecera para toda la casa. Flota sobre el cielo, así que no lleva
 * fondo propio: el degradado de abajo es el fondo. En móvil se queda el logo y
 * la acción — la navegación vive en el pie, que a esa altura ya está cerca.
 */
export default function SiteHeader({
  product,
  nav,
  cta,
}: {
  product?: Product;
  nav: NavLink[];
  cta: { href: string; label: string };
}) {
  const external = cta.href.startsWith("http");

  return (
    <header className="flex items-center justify-between px-5 py-5 sm:px-10">
      <Link href="/" aria-label={product ? `allok × ${product}` : "allok"}>
        <Lockup product={product} />
      </Link>

      <div className="flex items-center gap-5">
        <nav aria-label="Principal" className="hidden gap-6 text-sm opacity-85 md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="transition-opacity hover:opacity-100">
              {item.label}
            </Link>
          ))}
        </nav>
        {external ? (
          <a
            href={cta.href}
            className="allok-btn allok-btn-outline !rounded-full !px-4 !py-2.5 !text-sm backdrop-blur-sm"
          >
            {cta.label}
          </a>
        ) : (
          <Link
            href={cta.href}
            className="allok-btn allok-btn-outline !rounded-full !px-4 !py-2.5 !text-sm backdrop-blur-sm"
          >
            {cta.label}
          </Link>
        )}
      </div>
    </header>
  );
}
