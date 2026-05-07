type Primitive = string | number | boolean | null | undefined;

interface FilterDescriptor {
  field: string;
  operator?: 'contains' | 'eq';
  value: Primitive;
}

interface CompositeFilterDescriptor {
  logic: 'and' | 'or';
  filters: Array<FilterDescriptor | CompositeFilterDescriptor>;
}

interface GroupDescriptor {
  field: string;
}

interface ProcessOptions<T> {
  filter?: CompositeFilterDescriptor;
  group?: GroupDescriptor[];
}

function evaluateFilter<T>(item: T, filter: FilterDescriptor | CompositeFilterDescriptor): boolean {
  if ((filter as CompositeFilterDescriptor).filters) {
    const composite = filter as CompositeFilterDescriptor;
    const checks = composite.filters.map((f) => evaluateFilter(item, f));
    return composite.logic === 'and' ? checks.every(Boolean) : checks.some(Boolean);
  }

  const simple = filter as FilterDescriptor;
  const value = (item as any)?.[simple.field];
  const filterValue = simple.value;

  if (simple.operator === 'eq') {
    return value === filterValue;
  }

  // Default to contains, matching existing UI search behavior.
  return (value ?? '')
    .toString()
    .toLowerCase()
    .includes((filterValue ?? '').toString().toLowerCase());
}

function groupByDescriptors<T>(items: T[], groups: GroupDescriptor[], level = 0): any[] {
  const descriptor = groups[level];
  if (!descriptor) {
    return items as any[];
  }

  const groupedMap = new Map<string, T[]>();
  items.forEach((item) => {
    const key = ((item as any)?.[descriptor.field] ?? '').toString();
    if (!groupedMap.has(key)) {
      groupedMap.set(key, []);
    }
    groupedMap.get(key)!.push(item);
  });

  return Array.from(groupedMap.entries()).map(([value, groupedItems]) => {
    const nestedItems = level < groups.length - 1
      ? groupByDescriptors(groupedItems, groups, level + 1)
      : groupedItems;
    return {
      field: descriptor.field,
      value,
      items: nestedItems,
    };
  });
}

export function process<T>(items: T[], options: ProcessOptions<T> = {}): { data: any[] } {
  let data: any[] = Array.isArray(items) ? [...items] : [];

  if (options.filter) {
    data = data.filter((item) => evaluateFilter(item, options.filter!));
  }

  if (options.group?.length) {
    return { data: groupByDescriptors(data, options.group) };
  }

  return { data };
}