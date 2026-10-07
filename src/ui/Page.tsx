import React from 'react';
import { useHR } from '../core/context';
import { Link } from '../core/router';
import { Icon } from './Icon';

export function Page({ children }: { children: React.ReactNode }) {
  return <div className="hrm:mx-auto hrm:flex hrm:w-full hrm:max-w-[1400px] hrm:flex-col hrm:gap-4">{children}</div>;
}

export function PageHeader({
  title,
  description,
  actions,
  backTo,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  backTo?: string;
}) {
  const { labels } = useHR();
  return (
    <>
      {backTo && (
        <Link to={backTo} className="hrm:inline-flex hrm:w-fit hrm:items-center hrm:gap-1 hrm:font-medium hrm:text-muted hrm:hover:text-fg">
          <Icon name="chevron-left" size={16} /> {labels.back}
        </Link>
      )}
      <div className="hrm:flex hrm:flex-wrap hrm:items-start hrm:justify-between hrm:gap-4">
        <div className="hrm:min-w-0">
          <h2 className="hrm:text-2xl hrm:font-bold hrm:tracking-tight">{title}</h2>
          {description && <p className="hrm:mt-1 hrm:text-muted">{description}</p>}
        </div>
        {actions && <div className="hrm:flex hrm:flex-wrap hrm:gap-2">{actions}</div>}
      </div>
    </>
  );
}
