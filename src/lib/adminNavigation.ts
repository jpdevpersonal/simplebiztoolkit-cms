type AdminRouterLike = {
  push: (href: string) => void;
  refresh: () => void;
};

export function redirectAndRefresh(router: AdminRouterLike, href: string) {
  router.push(href);
  router.refresh();
}

export function refreshEditor(router: Pick<AdminRouterLike, "refresh">) {
  router.refresh();
}
