import * as React from 'react';

import {
  Box,
  Button,
  Field,
  Flex,
  IconButton,
  SingleSelect,
  SingleSelectOption,
  Typography,
} from '@strapi/design-system';
import { CaretDown, CaretUp, Plus, Trash } from '@strapi/icons';

const MAX_ALLOWED_LEVEL = 6;

const createNode = () => ({
  id: `node_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
  title: '',
  url: '',
  children: [],
});

const normalizeValue = (value) => {
  if (!value) {
    return { maxDepth: 3, items: [] };
  }

  if (Array.isArray(value)) {
    return { maxDepth: 3, items: value };
  }

  return {
    maxDepth: Number(value.maxDepth) || 3,
    items: Array.isArray(value.items) ? value.items : [],
  };
};

const updateNodeById = (items, targetId, updater) =>
  items.map((item) => {
    if (item.id === targetId) return updater(item);
    if (!item.children?.length) return item;

    return {
      ...item,
      children: updateNodeById(item.children, targetId, updater),
    };
  });

const removeNodeById = (items, targetId) =>
  items
    .filter((item) => item.id !== targetId)
    .map((item) => ({
      ...item,
      children: removeNodeById(item.children || [], targetId),
    }));

const countChildren = (node) => (Array.isArray(node.children) ? node.children.length : 0);
const countAllNodes = (items) =>
  items.reduce(
    (total, item) => total + 1 + countAllNodes(Array.isArray(item.children) ? item.children : []),
    0
  );

const collectNodeIds = (items) =>
  items.flatMap((item) => [
    item.id,
    ...collectNodeIds(Array.isArray(item.children) ? item.children : []),
  ]);

const levelHeaderBg = (level) => (level === 1 ? 'primary100' : 'neutral100');

function NodeEditor({
  node,
  level,
  maxDepth,
  disabled,
  collapsed,
  onToggleCollapse,
  onChangeNode,
  onAddChild,
  onDeleteNode,
  isCollapsed,
}) {
  return (
    <Box
      borderColor="neutral300"
      borderStyle="solid"
      borderWidth="1px"
      borderRadius="8px"
      background="neutral0"
      marginTop={3}
      marginLeft={level > 1 ? 5 : 0}
      width="100%"
    >
      <Flex
        justifyContent="space-between"
        alignItems="center"
        padding={3}
        background={levelHeaderBg(level)}
      >
        <Flex alignItems="center" gap={2}>
          <IconButton
            label={collapsed ? 'Expand' : 'Collapse'}
            variant="ghost"
            onClick={() => onToggleCollapse(node.id)}
            disabled={disabled}
          >
            {collapsed ? <CaretDown /> : <CaretUp />}
          </IconButton>
          <Flex direction="column" gap={0}>
            <Typography fontWeight="bold">
              {node.title?.trim() || 'Untitled'}
            </Typography>
            <Typography variant="pi" textColor="neutral600">
              Level {level} {level < maxDepth ? '' : '(max)'}
            </Typography>
          </Flex>
        </Flex>
        <Flex gap={2}>
          {level < maxDepth ? (
            <Button
              size="M"
              variant="tertiary"
              startIcon={<Plus />}
              onClick={() => onAddChild(node.id)}
              disabled={disabled}
            >
              Add Child
            </Button>
          ) : null}
          <IconButton
            label="Delete item"
            variant="ghost"
            onClick={() => onDeleteNode(node.id)}
            disabled={disabled}
          >
            <Trash />
          </IconButton>
        </Flex>
      </Flex>

      {!collapsed ? (
        <Box padding={4}>
          <Flex direction="column" gap={3}>
            <Flex gap={3} wrap="wrap">
              <Field.Root name={`${node.id}-label`} style={{ flex: 1,minWidth: 400 }}>
                <Field.Label>Nav Label</Field.Label>
                <Field.Input
                  value={node.title || ''}
                  disabled={disabled}
                  onChange={(e) => onChangeNode(node.id, { title: e.target.value })}
                />
              </Field.Root>
              <Field.Root name={`${node.id}-url`} style={{ flex: 1,minWidth: 400 }}>
                <Field.Label>Nav URL</Field.Label>
                <Field.Input
                  value={node.url || ''}
                  disabled={disabled}
                  onChange={(e) => onChangeNode(node.id, { url: e.target.value })}
                />
              </Field.Root>
            </Flex>

            

            {(node.children || []).map((child) => (
              <NodeEditor
                key={child.id}
                node={child}
                level={level + 1}
                maxDepth={maxDepth}
                disabled={disabled}
                collapsed={isCollapsed(child.id)}
                onToggleCollapse={onToggleCollapse}
                onChangeNode={onChangeNode}
                onAddChild={onAddChild}
                onDeleteNode={onDeleteNode}
                isCollapsed={isCollapsed}
              />
            ))}

            {level >= maxDepth ? (
              <Typography variant="pi" textColor="neutral600">
                Max nesting reached for this branch (Level {maxDepth})
              </Typography>
            ) : null}
          </Flex>
        </Box>
      ) : null}
    </Box>
  );
}

export default function MegaMenuFieldInput(props) {
  const { name, value, onChange, disabled, error, hint, required } = props;
  const normalized = normalizeValue(value);
  const { maxDepth, items } = normalized;

  const [collapsedIds, setCollapsedIds] = React.useState(new Set());
  const totalNodes = React.useMemo(() => countAllNodes(items), [items]);

  const emit = React.useCallback(
    (nextValue) => {
      onChange({
        target: {
          name,
          type: 'json',
          value: nextValue,
        },
      });
    },
    [name, onChange]
  );

  const toggleCollapse = (id) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const collapseAll = () => {
    setCollapsedIds(new Set(collectNodeIds(items)));
  };

  const expandAll = () => {
    setCollapsedIds(new Set());
  };

  const setMaxDepth = (nextDepth) => {
    emit({
      ...normalized,
      maxDepth: nextDepth,
    });
  };

  const addRootItem = () => {
    emit({
      ...normalized,
      items: [...items, createNode()],
    });
  };

  const addChild = (parentId) => {
    emit({
      ...normalized,
      items: updateNodeById(items, parentId, (node) => ({
        ...node,
        children: [...(node.children || []), createNode()],
      })),
    });
  };

  const updateNode = (nodeId, patch) => {
    emit({
      ...normalized,
      items: updateNodeById(items, nodeId, (node) => ({
        ...node,
        ...patch,
      })),
    });
  };

  const deleteNode = (nodeId) => {
    emit({
      ...normalized,
      items: removeNodeById(items, nodeId),
    });
  };

  return (
    <Field.Root name={name} error={error} hint={hint} required={required}>
      <Field.Label>Mega Menu</Field.Label>
      <Box
        padding={5}
        background="neutral0"
        borderColor="neutral200"
        borderStyle="solid"
        borderWidth="1px"
        borderRadius="8px"
        width="100%"
      >
        <Flex direction="column" gap={4}>
          <Flex justifyContent="space-between" alignItems="flex-end" gap={4} wrap="wrap">
            <Field.Root name={`${name}-maxDepth`} style={{ minWidth: 750 }}>
              <Field.Label>Max Nesting Level</Field.Label>
              <SingleSelect
                value={maxDepth}
                onChange={(val) => setMaxDepth(Number(val))}
                disabled={disabled}
              >
                {Array.from({ length: MAX_ALLOWED_LEVEL }, (_, i) => i + 1).map((level) => (
                  <SingleSelectOption key={level} value={level}>
                    Level {level}
                  </SingleSelectOption>
                ))}
              </SingleSelect>
            </Field.Root>

            <Flex gap={2}>
              <Button size="M" variant="secondary" onClick={expandAll} disabled={disabled}>
                Expand all
              </Button>
              <Button size="M" variant="secondary" onClick={collapseAll} disabled={disabled}>
                Collapse all
              </Button>
            </Flex>
          </Flex>


          {items.length === 0 ? (
            <Box
              padding={5}
              background="neutral100"
              borderColor="neutral200"
              borderStyle="dashed"
              borderWidth="1px"
              borderRadius="8px"
            >
              <Typography textColor="neutral600">
                No menu entries yet. Start by adding a root item.
              </Typography>
            </Box>
          ) : (
            items.map((node) => (
              <NodeEditor
                key={node.id}
                node={node}
                level={1}
                maxDepth={maxDepth}
                disabled={disabled}
                collapsed={collapsedIds.has(node.id)}
                onToggleCollapse={toggleCollapse}
                onChangeNode={updateNode}
                onAddChild={addChild}
                onDeleteNode={deleteNode}
                isCollapsed={(id) => collapsedIds.has(id)}
              />
            ))
          )}

          <Button
            variant="secondary"
            startIcon={<Plus />}
            onClick={addRootItem}
            disabled={disabled}
            size="M"
          >
            Add an entry
          </Button>
        </Flex>
      </Box>
      <Field.Error />
      <Field.Hint />
    </Field.Root>
  );
}
