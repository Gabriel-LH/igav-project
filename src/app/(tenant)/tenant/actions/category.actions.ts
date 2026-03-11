"use server";

import prisma from "@/src/lib/prisma";
import { requireTenantMembership } from "@/src/infrastructure/tenant/auth.guard";
import { CategoryFormData } from "@/src/types/category/type.category";
import { generateSlug } from "@/src/utils/category/categoryTree";
import { revalidatePath } from "next/cache";

const normalizeParentId = (parentId?: string | null): string | undefined => {
  if (!parentId) return undefined;
  const trimmed = parentId.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const findDescendantIds = (categories: any[], parentId: string): string[] => {
  const descendants: string[] = [];
  const children = categories.filter((category) => category.parentId === parentId);
  for (const child of children) {
    descendants.push(child.id);
    descendants.push(...findDescendantIds(categories, child.id));
  }
  return descendants;
};

export async function getCategoriesAction() {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }

    const categories = await prisma.category.findMany({
      where: { tenantId },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    const productCounts = await prisma.product.groupBy({
      by: ["categoryId"],
      where: { tenantId },
      _count: { _all: true },
    });

    const directCountMap = new Map<string, number>(
      productCounts.map((row) => [row.categoryId, row._count._all]),
    );

    const childrenMap = new Map<string, string[]>();
    categories.forEach((category) => {
      if (!category.parentId) return;
      if (!childrenMap.has(category.parentId)) {
        childrenMap.set(category.parentId, []);
      }
      childrenMap.get(category.parentId)!.push(category.id);
    });

    const totalCountMap = new Map<string, number>();
    const computeTotal = (categoryId: string): number => {
      if (totalCountMap.has(categoryId)) {
        return totalCountMap.get(categoryId)!;
      }
      const direct = directCountMap.get(categoryId) ?? 0;
      const children = childrenMap.get(categoryId) ?? [];
      const total =
        direct + children.reduce((sum, childId) => sum + computeTotal(childId), 0);
      totalCountMap.set(categoryId, total);
      return total;
    };

    categories.forEach((category) => {
      computeTotal(category.id);
    });

    const withCounts = categories.map((category) => ({
      ...category,
      productCount: directCountMap.get(category.id) ?? 0,
      totalProductCount: totalCountMap.get(category.id) ?? 0,
    }));

    return { success: true, data: withCounts };
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al obtener categorías",
    };
  }
}

export async function createCategoryAction(formData: CategoryFormData) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }

    const categories = await prisma.category.findMany({
      where: { tenantId },
      select: { id: true, parentId: true, slug: true, path: true, level: true },
    });

    const parentId = normalizeParentId(formData.parentId);
    const parentCategory = parentId
      ? categories.find((category) => category.id === parentId)
      : undefined;
    if (parentId && !parentCategory) {
      throw new Error("La categoría padre no existe para este tenant.");
    }

    const existingSlugs = categories
      .map((category) => category.slug)
      .filter((slug): slug is string => Boolean(slug));
    const slugBase = formData.slug?.trim() || formData.name;
    const slug = generateSlug(slugBase, existingSlugs);
    const level = parentCategory ? (parentCategory.level ?? 0) + 1 : 0;
    const parentPath = parentCategory?.path ?? parentCategory?.slug ?? "";
    const path = parentCategory ? `${parentPath}/${slug}` : slug;

    const category = await prisma.category.create({
      data: {
        tenantId,
        name: formData.name,
        description: formData.description,
        parentId,
        level,
        path,
        image: formData.image,
        color: formData.color,
        icon: formData.icon,
        slug,
        order: formData.order ?? 0,
        isActive: formData.isActive ?? true,
        showInPos: formData.showInPos ?? true,
        showInEcommerce: formData.showInEcommerce ?? true,
        createdBy: membership.user.id,
        updatedBy: membership.user.id,
      },
    });

    revalidatePath("/tenant/catalogs/categories");
    revalidatePath("/tenant/inventory/catalogs");
    return { success: true, data: category };
  } catch (error) {
    console.error("Error al crear categoría:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al crear categoría",
    };
  }
}

export async function updateCategoryAction(
  categoryId: string,
  formData: CategoryFormData,
) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }

    const categories = await prisma.category.findMany({
      where: { tenantId },
      select: {
        id: true,
        parentId: true,
        slug: true,
        path: true,
        level: true,
      },
    });

    const currentCategory = categories.find((c) => c.id === categoryId);
    if (!currentCategory) {
      throw new Error("La categoría no existe para este tenant.");
    }

    const parentId = normalizeParentId(formData.parentId);
    if (parentId === currentCategory.id) {
      throw new Error("Una categoría no puede ser padre de sí misma.");
    }

    const descendants = findDescendantIds(categories, currentCategory.id);
    if (parentId && descendants.includes(parentId)) {
      throw new Error(
        "No se puede mover una categoría dentro de sus descendientes.",
      );
    }

    const parentCategory = parentId
      ? categories.find((category) => category.id === parentId)
      : undefined;
    if (parentId && !parentCategory) {
      throw new Error("La categoría padre no existe para este tenant.");
    }

    const categoriesWithoutCurrent = categories.filter(
      (category) => category.id !== currentCategory.id,
    );
    const existingSlugs = categoriesWithoutCurrent
      .map((category) => category.slug)
      .filter((slug): slug is string => Boolean(slug));
    const nextName = formData.name ?? "";
    const nextSlug = formData.slug?.trim()
      ? generateSlug(formData.slug, existingSlugs)
      : generateSlug(nextName, existingSlugs);
    const nextLevel = parentCategory ? (parentCategory.level ?? 0) + 1 : 0;
    const parentPath = parentCategory?.path ?? parentCategory?.slug ?? "";
    const nextPath = parentCategory ? `${parentPath}/${nextSlug}` : nextSlug;

    const currentPath = currentCategory.path ?? currentCategory.slug ?? "";
    const oldPathPrefix = `${currentPath}/`;
    const nextPathPrefix = `${nextPath}/`;

    await prisma.$transaction(async (tx) => {
      await tx.category.update({
        where: { id: categoryId },
        data: {
          name: formData.name,
          description: formData.description,
          parentId,
          level: nextLevel,
          path: nextPath,
          image: formData.image,
          color: formData.color,
          icon: formData.icon,
          slug: nextSlug,
          order: formData.order ?? 0,
          isActive: formData.isActive ?? true,
          showInPos: formData.showInPos ?? true,
          showInEcommerce: formData.showInEcommerce ?? true,
          updatedBy: membership.user.id,
        },
      });

      for (const category of categories) {
        if (category.id === categoryId || !descendants.includes(category.id)) {
          continue;
        }

        const relativePath =
          currentPath && category.path?.startsWith(oldPathPrefix)
            ? category.path.slice(oldPathPrefix.length)
            : (category.path?.replace(currentPath, "")?.replace(/^\/+/, "") ??
              "");
        const nextCategoryPath = relativePath
          ? `${nextPathPrefix}${relativePath}`
          : nextPath;
        const levelOffset = (currentCategory.level ?? 0) - (category.level ?? 0);

        await tx.category.update({
          where: { id: category.id },
          data: {
            path: nextCategoryPath,
            level: nextLevel - levelOffset,
            updatedBy: membership.user.id,
          },
        });
      }
    });

    const updatedCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    revalidatePath("/tenant/catalogs/categories");
    revalidatePath("/tenant/inventory/catalogs");
    return { success: true, data: updatedCategory };
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al actualizar categoría",
    };
  }
}

export async function deleteCategoryAction(categoryId: string) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }

    const categories = await prisma.category.findMany({
      where: { tenantId },
      select: { id: true, parentId: true },
    });
    const descendantIds = findDescendantIds(categories, categoryId);
    const idsToDelete = [categoryId, ...descendantIds];

    await prisma.category.deleteMany({
      where: {
        tenantId,
        id: { in: idsToDelete },
      },
    });

    revalidatePath("/tenant/catalogs/categories");
    revalidatePath("/tenant/inventory/catalogs");
    return { success: true, deletedIds: idsToDelete };
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al eliminar categoría",
    };
  }
}

export async function updateCategoryOrderAction(
  updates: Array<{ id: string; order: number }>,
) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }

    if (!updates.length) {
      return { success: true };
    }

    const ids = updates.map((u) => u.id);
    const existing = await prisma.category.findMany({
      where: { tenantId, id: { in: ids } },
      select: { id: true },
    });

    if (existing.length !== ids.length) {
      throw new Error("Algunas categorías no existen para este tenant.");
    }

    await prisma.$transaction(
      updates.map((update) =>
        prisma.category.update({
          where: { id: update.id },
          data: { order: update.order, updatedBy: membership.user.id },
        }),
      ),
    );

    revalidatePath("/tenant/catalogs/categories");
    revalidatePath("/tenant/inventory/catalogs");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar orden:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al actualizar orden",
    };
  }
}

export async function moveCategoryAction(input: {
  categoryId: string;
  parentId?: string | null;
  position?: number;
}) {
  try {
    const membership = await requireTenantMembership();
    const tenantId = membership.tenantId;
    if (!tenantId) {
      throw new Error("El ID del tenant es obligatorio.");
    }

    const categories = await prisma.category.findMany({
      where: { tenantId },
      select: {
        id: true,
        parentId: true,
        slug: true,
        path: true,
        level: true,
        order: true,
      },
    });

    const currentCategory = categories.find((c) => c.id === input.categoryId);
    if (!currentCategory) {
      throw new Error("La categoría no existe para este tenant.");
    }

    const targetParentId = normalizeParentId(input.parentId);
    if (targetParentId === currentCategory.id) {
      throw new Error("Una categoría no puede ser padre de sí misma.");
    }

    const descendants = findDescendantIds(categories, currentCategory.id);
    if (targetParentId && descendants.includes(targetParentId)) {
      throw new Error(
        "No se puede mover una categoría dentro de sus descendientes.",
      );
    }

    const parentCategory = targetParentId
      ? categories.find((category) => category.id === targetParentId)
      : undefined;
    if (targetParentId && !parentCategory) {
      throw new Error("La categoría padre no existe para este tenant.");
    }

    const nextLevel = parentCategory ? (parentCategory.level ?? 0) + 1 : 0;
    const parentPath = parentCategory?.path ?? parentCategory?.slug ?? "";
    const nextPath = parentCategory
      ? `${parentPath}/${currentCategory.slug ?? currentCategory.id}`
      : currentCategory.slug ?? currentCategory.id;

    const currentPath = currentCategory.path ?? currentCategory.slug ?? "";
    const oldPathPrefix = `${currentPath}/`;
    const nextPathPrefix = `${nextPath}/`;

    const oldParentId = currentCategory.parentId ?? null;
    const newParentId = targetParentId ?? null;

    const siblingsOld = categories
      .filter((c) => (c.parentId ?? null) === oldParentId && c.id !== currentCategory.id)
      .sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        return a.id.localeCompare(b.id);
      });

    const siblingsNew = categories
      .filter((c) => (c.parentId ?? null) === newParentId && c.id !== currentCategory.id)
      .sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        return a.id.localeCompare(b.id);
      });

    const insertIndex =
      typeof input.position === "number" && input.position >= 0
        ? Math.min(input.position, siblingsNew.length)
        : siblingsNew.length;

    const nextSiblingsNew = [...siblingsNew];
    nextSiblingsNew.splice(insertIndex, 0, currentCategory);

    await prisma.$transaction(async (tx) => {
      await tx.category.update({
        where: { id: currentCategory.id },
        data: {
          parentId: targetParentId,
          level: nextLevel,
          path: nextPath,
          order: insertIndex,
          updatedBy: membership.user.id,
        },
      });

      for (const [index, category] of siblingsOld.entries()) {
        await tx.category.update({
          where: { id: category.id },
          data: {
            order: index,
            updatedBy: membership.user.id,
          },
        });
      }

      for (const [index, category] of nextSiblingsNew.entries()) {
        if (category.id === currentCategory.id) {
          continue;
        }
        await tx.category.update({
          where: { id: category.id },
          data: {
            order: index,
            updatedBy: membership.user.id,
          },
        });
      }

      for (const category of categories) {
        if (category.id === currentCategory.id || !descendants.includes(category.id)) {
          continue;
        }

        const relativePath =
          currentPath && category.path?.startsWith(oldPathPrefix)
            ? category.path.slice(oldPathPrefix.length)
            : (category.path?.replace(currentPath, "")?.replace(/^\/+/, "") ??
              "");
        const nextCategoryPath = relativePath
          ? `${nextPathPrefix}${relativePath}`
          : nextPath;
        const levelOffset = (currentCategory.level ?? 0) - (category.level ?? 0);

        await tx.category.update({
          where: { id: category.id },
          data: {
            path: nextCategoryPath,
            level: nextLevel - levelOffset,
            updatedBy: membership.user.id,
          },
        });
      }
    });

    revalidatePath("/tenant/catalogs/categories");
    revalidatePath("/tenant/inventory/catalogs");
    return { success: true };
  } catch (error) {
    console.error("Error al mover categoría:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al mover categoría",
    };
  }
}
