import Link from "next/link";

type SupportSidebarLink = {
  href: string;
  label: string;
  external?: boolean;
};

type SupportSidebarCardProps = {
  description: string;
  linksHeading: string;
  links: SupportSidebarLink[];
};

export default function SupportSidebarCard({
  description,
  linksHeading,
  links,
}: SupportSidebarCardProps) {
  return (
    <div className="card">
      <div className="card-body d-flex flex-column">
        <h3 className="h6" style={{ fontWeight: 800 }}>
          Need more help?
        </h3>
        <p className="sb-muted mb-3">{description}</p>
        <Link href="/contact" className="btn btn-primary mt-auto">
          Contact page
        </Link>

        <hr />
        <h4 className="h6">{linksHeading}</h4>
        <ul className="list-unstyled sb-muted small">
          {links.map((link) => (
            <li key={link.href}>
              {link.external ? (
                <a href={link.href}>{link.label}</a>
              ) : (
                <Link href={link.href}>{link.label}</Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
