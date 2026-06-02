export interface EntityTabProps {
  entity: any;
  entityId: string;
}

export interface EntityDetailSidebarProps {
  entity: any;
  entityId: string;
}

export interface EntityDetailHeaderActionsProps {
  entity: any;
  entityId: string;
}

export interface EntityListActionsProps {
  refetch: () => void;
}

export interface EntityListFiltersProps {
  onFilter: (filters: Record<string, any>) => void;
}

export interface EntityListProps {}

export interface EntityDetailProps {
  entityId: string;
}

export interface EntityCreateProps {}

export interface PageProps {}

export interface DashboardWidgetProps {}
