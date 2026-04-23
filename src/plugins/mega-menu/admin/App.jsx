import * as React from 'react';

import {
  Box,
  Button,
  Card,
  Flex,
  Field,
  IconButton,
  Modal,
  SingleSelect,
  SingleSelectOption,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Typography,
  Loader,
} from '@strapi/design-system';
import { Pencil, Trash } from '@strapi/icons';
import { useFetchClient, useNotification } from '@strapi/admin/strapi-admin';
import { Page } from '@strapi/strapi/admin';

const API_BASE = '/mega-menu/items';

const PARENT_NONE = '__mega_menu_none__';
const MAX_ALLOWED_LEVEL = 6;

const getKey = (item) => String(item?.documentId ?? item?.id ?? '');

const getParentKey = (item) =>
  String(item?.parent?.documentId ?? item?.parent?.id ?? '');

const buildDepthMap = (items) => {
  const mapByKey = new Map(items.map((item) => [getKey(item), item]));
  const memo = new Map();

  const getDepth = (item, stack = new Set()) => {
    const key = getKey(item);
    if (!key) return 1;
    if (memo.has(key)) return memo.get(key);
    if (stack.has(key)) return 1;

    stack.add(key);
    const parentKey = getParentKey(item);
    let depth = 1;

    if (parentKey && mapByKey.has(parentKey)) {
      depth = getDepth(mapByKey.get(parentKey), stack) + 1;
    }

    stack.delete(key);
    memo.set(key, depth);
    return depth;
  };

  for (const item of items) {
    getDepth(item);
  }

  return memo;
};

const sortItemsAsTree = (items) => {
  const childrenByParent = new Map();

  const pushChild = (parentKey, child) => {
    if (!childrenByParent.has(parentKey)) {
      childrenByParent.set(parentKey, []);
    }
    childrenByParent.get(parentKey).push(child);
  };

  for (const item of items) {
    const parentKey = getParentKey(item);
    pushChild(parentKey || '__root__', item);
  }

  const sortFn = (a, b) => {
    const first = String(a?.title ?? '');
    const second = String(b?.title ?? '');
    return first.localeCompare(second);
  };

  for (const [, list] of childrenByParent) {
    list.sort(sortFn);
  }

  const output = [];
  const walk = (parentKey) => {
    const list = childrenByParent.get(parentKey) ?? [];
    for (const item of list) {
      output.push(item);
      walk(getKey(item));
    }
  };

  walk('__root__');
  return output;
};

function MenuItemForm({
  title,
  url,
  parentDocumentId,
  onTitleChange,
  onUrlChange,
  onParentChange,
  parentChoices,
  parentDepths,
  maxDepth,
  submitLabel,
  submitting,
}) {
  const selectValue =
    parentDocumentId == null ? PARENT_NONE : parentDocumentId;

  return (
    <Flex direction="column" alignItems="stretch" gap={4}>
      <Field.Root name="title">
        <Field.Label>Title</Field.Label>
        <Field.Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Home"
          required
        />
      </Field.Root>
      <Field.Root name="url">
        <Field.Label>URL</Field.Label>
        <Field.Input
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="/ or https://..."
          required
        />
      </Field.Root>
      <Field.Root name="parent">
        <Field.Label>Parent</Field.Label>
        <SingleSelect
          placeholder="No parent (top level)"
          value={selectValue}
          onChange={(value) =>
            onParentChange(
              value === PARENT_NONE ||
                value === '' ||
                value === null ||
                value === undefined
                ? null
                : String(value)
            )
          }
        >
          <SingleSelectOption value={PARENT_NONE}>
            No parent (top level)
          </SingleSelectOption>
          {parentChoices.map((item) => (
            <SingleSelectOption key={item.documentId} value={item.documentId}>
              {item.title} (Level {parentDepths.get(getKey(item)) ?? 1})
            </SingleSelectOption>
          ))}
        </SingleSelect>
        <Field.Hint>
          New item max level: {maxDepth}. Selecting a parent creates this item at
          the next level.
        </Field.Hint>
      </Field.Root>
      <Flex justifyContent="flex-start">
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </Flex>
    </Flex>
  );
}

export default function App() {
  const { get, post, put, del } = useFetchClient();
  const { toggleNotification } = useNotification();

  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [maxDepth, setMaxDepth] = React.useState(3);

  const [addTitle, setAddTitle] = React.useState('');
  const [addUrl, setAddUrl] = React.useState('');
  const [addParentId, setAddParentId] = React.useState(null);

  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [editUrl, setEditUrl] = React.useState('');
  const [editParentId, setEditParentId] = React.useState(null);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(null);

  const loadItems = React.useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const { data } = await get(API_BASE);
      setItems(data?.data ?? []);
    } catch (err) {
      const message = err?.message || 'Could not load menu items';
      toggleNotification({
        type: 'warning',
        message,
      });
      setErrorMessage(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [get, toggleNotification]);

  React.useEffect(() => {
    loadItems();
  }, [loadItems]);

  const depthMap = React.useMemo(() => buildDepthMap(items), [items]);
  const treeOrderedItems = React.useMemo(() => sortItemsAsTree(items), [items]);

  const parentChoicesForAdd = React.useMemo(
    () => items.filter((i) => (depthMap.get(getKey(i)) ?? 1) < maxDepth),
    [items, depthMap, maxDepth]
  );

  const parentChoicesForEdit = React.useMemo(
    () =>
      items.filter(
        (i) =>
          i.documentId !== editing?.documentId &&
          (depthMap.get(getKey(i)) ?? 1) < maxDepth
      ),
    [items, editing, depthMap, maxDepth]
  );

  const resetAddForm = () => {
    setAddTitle('');
    setAddUrl('');
    setAddParentId(null);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!addTitle.trim() || !addUrl.trim()) {
      toggleNotification({
        type: 'warning',
        message: 'Title and URL are required.',
      });
      return;
    }
    setSaving(true);
    try {
      await post(API_BASE, {
        title: addTitle.trim(),
        url: addUrl.trim(),
        parent: addParentId || null,
      });
      toggleNotification({
        type: 'success',
        message: 'Menu item created.',
      });
      resetAddForm();
      await loadItems();
    } catch (err) {
      toggleNotification({
        type: 'warning',
        message: err?.message || 'Could not create menu item',
      });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (row) => {
    setEditing(row);
    setEditTitle(row.title ?? '');
    setEditUrl(row.url ?? '');
    const p = row.parent;
    setEditParentId(
      p && typeof p === 'object' && p.documentId ? p.documentId : null
    );
    setEditOpen(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    const editingId = editing?.id ?? editing?.documentId;
    if (!editingId) return;
    if (!editTitle.trim() || !editUrl.trim()) {
      toggleNotification({
        type: 'warning',
        message: 'Title and URL are required.',
      });
      return;
    }
    setSaving(true);
    try {
      await put(`${API_BASE}/${editingId}`, {
        title: editTitle.trim(),
        url: editUrl.trim(),
        parent: editParentId,
      });
      toggleNotification({
        type: 'success',
        message: 'Menu item updated.',
      });
      setEditOpen(false);
      setEditing(null);
      await loadItems();
    } catch (err) {
      toggleNotification({
        type: 'warning',
        message: err?.message || 'Could not update menu item',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const deletingId = deleting?.id ?? deleting?.documentId;
    if (!deletingId) return;
    setSaving(true);
    try {
      await del(`${API_BASE}/${deletingId}`);
      toggleNotification({
        type: 'success',
        message: 'Menu item deleted.',
      });
      setDeleteOpen(false);
      setDeleting(null);
      await loadItems();
    } catch (err) {
      toggleNotification({
        type: 'warning',
        message: err?.message || 'Could not delete menu item',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page.Main>
      <Page.Title>Mega Menu</Page.Title>
      <Typography variant="omega" textColor="neutral600" paddingBottom={4}>
        Manage navigation links in tree format with configurable nesting depth.
      </Typography>

      <Card padding={4} marginBottom={6}>
        <Flex direction="column" alignItems="stretch" gap={4}>
          <Field.Root name="maxDepth">
            <Field.Label>Max Nesting Level</Field.Label>
            <SingleSelect
              value={maxDepth}
              onChange={(value) => setMaxDepth(Number(value))}
            >
              {Array.from({ length: MAX_ALLOWED_LEVEL }, (_, index) => {
                const level = index + 1;
                return (
                  <SingleSelectOption key={level} value={level}>
                    Level {level}
                  </SingleSelectOption>
                );
              })}
            </SingleSelect>
            <Field.Hint>
              Parent dropdown only shows items that can accept another child
              level.
            </Field.Hint>
          </Field.Root>
        </Flex>
      </Card>

      <Card padding={4} marginBottom={6}>
        <Typography tag="h2" variant="delta" paddingBottom={4}>
          Add menu item
        </Typography>
        <Box tag="form" onSubmit={handleAdd}>
          <MenuItemForm
            title={addTitle}
            url={addUrl}
            parentDocumentId={addParentId}
            onTitleChange={setAddTitle}
            onUrlChange={setAddUrl}
            onParentChange={setAddParentId}
            parentChoices={parentChoicesForAdd}
            parentDepths={depthMap}
            maxDepth={maxDepth}
            submitLabel="Add item"
            submitting={saving}
          />
        </Box>
      </Card>

      <Typography tag="h2" variant="delta" paddingBottom={4}>
        Menu items
      </Typography>
      {errorMessage ? (
        <Typography textColor="danger600" paddingBottom={4}>
          {errorMessage}
        </Typography>
      ) : null}

      {loading ? (
        <Flex justifyContent="center" paddingTop={6}>
          <Loader>Loading menu items…</Loader>
        </Flex>
      ) : (
        <Table colCount={5} rowCount={treeOrderedItems.length}>
          <Thead>
            <Tr>
              <Th>
                <Typography variant="sigma">Title</Typography>
              </Th>
              <Th>
                <Typography variant="sigma">Level</Typography>
              </Th>
              <Th>
                <Typography variant="sigma">URL</Typography>
              </Th>
              <Th>
                <Typography variant="sigma">Parent</Typography>
              </Th>
              <Th>
                <Typography variant="sigma">Actions</Typography>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {treeOrderedItems.length === 0 ? (
              <Tr>
                <Td colSpan={5}>
                  <Typography textColor="neutral600">
                    No menu items yet. Add one above.
                  </Typography>
                </Td>
              </Tr>
            ) : (
              treeOrderedItems.map((row) => {
                const rowDepth = depthMap.get(getKey(row)) ?? 1;
                const parentTitle =
                  row.parent && typeof row.parent === 'object'
                    ? row.parent.title
                    : null;
                return (
                  <Tr key={row.documentId}>
                    <Td>
                      <Typography fontWeight="bold">
                        {'\u00A0'.repeat((rowDepth - 1) * 3)}
                        {rowDepth > 1 ? '- ' : ''}
                        {row.title}
                      </Typography>
                    </Td>
                    <Td>
                      <Typography>{rowDepth}</Typography>
                    </Td>
                    <Td>
                      <Typography>{row.url}</Typography>
                    </Td>
                    <Td>
                      <Typography textColor="neutral600">
                        {parentTitle || '—'}
                      </Typography>
                    </Td>
                    <Td>
                      <Flex gap={2}>
                        <IconButton
                          onClick={() => openEdit(row)}
                          label="Edit"
                          variant="ghost"
                        >
                          <Pencil />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            setDeleting(row);
                            setDeleteOpen(true);
                          }}
                          label="Delete"
                          variant="ghost"
                        >
                          <Trash />
                        </IconButton>
                      </Flex>
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </Table>
      )}

      <Modal.Root
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setEditing(null);
          }
        }}
      >
        <Modal.Content>
          <Modal.Header>
            <Modal.Title>Edit menu item</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Box tag="form" onSubmit={handleEditSave}>
              <MenuItemForm
                title={editTitle}
                url={editUrl}
                parentDocumentId={editParentId}
                onTitleChange={setEditTitle}
                onUrlChange={setEditUrl}
                onParentChange={setEditParentId}
                parentChoices={parentChoicesForEdit}
                parentDepths={depthMap}
                maxDepth={maxDepth}
                submitLabel="Save changes"
                submitting={saving}
              />
            </Box>
          </Modal.Body>
          <Modal.Footer>
            <Modal.Close>
              <Button variant="tertiary">Cancel</Button>
            </Modal.Close>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>

      <Modal.Root
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            setDeleting(null);
          }
        }}
      >
        <Modal.Content>
          <Modal.Header>
            <Modal.Title>Delete menu item</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Typography>
              Delete “{deleting?.title ?? ''}”? This cannot be undone.
            </Typography>
          </Modal.Body>
          <Modal.Footer>
            <Flex gap={2}>
              <Button
                variant="danger-light"
                loading={saving}
                onClick={handleDeleteConfirm}
              >
                Delete
              </Button>
              <Modal.Close>
                <Button variant="tertiary">Cancel</Button>
              </Modal.Close>
            </Flex>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>
    </Page.Main>
  );
}
