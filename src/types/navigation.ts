export interface NavigationItem {
  name: string;
  href: string;
  current?: boolean;
}

export interface PageProps {
  onNavigate: (page: string) => void;
  currentPage: string;
}