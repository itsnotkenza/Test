export type ProductsType = "TSHIRT" | "PULL";

export type Product = {
  name: string;
  quantity: number;
  type: ProductsType;
  price: number;
};

type BaseDiscount = {
  code: string;
  minCartTotal?: number;
  applicableProductTypes?: ProductsType[];
};

export type PercentageDiscount = BaseDiscount & {
  type: "PERCENTAGE";
  value: number;
};

export type FixedDiscount = BaseDiscount & {
  type: "FIXED";
  value: number;
};

export type ProductDiscount = BaseDiscount & {
  type: "PRODUCT";
  buyQuantity: number;
  freeQuantity: number;
};

export type BlackFridayDiscount = {
  type: "BLACK_FRIDAY";
  code: string;
};

export type Discount =
  | PercentageDiscount
  | FixedDiscount
  | ProductDiscount
  | BlackFridayDiscount;

export type PriceSummary = {
  subtotal: number;
  productDiscount: number;
  standardDiscount: number;
  blackFridayDiscount: number;
  finalTotal: number;
};

export type NotificationService = {
  notifyFinalPrice: (finalPrice: number) => void;
};

// ======================================================
// Test 4 - REFACTOR
// Extraction de la règle d’éligibilité d’une réduction
// dans un helper dédié pour alléger le use case.
//
// ROUGE : le test échouait car la réduction s’appliquait
// même lorsque minCartTotal n’était pas atteint.
//
// VERT : ajout d’une condition dans la boucle principale.
//
// REFACTOR : extraction dans isDiscountEligible()
// pour rendre le code plus lisible et réutilisable.
// ======================================================
function isDiscountEligible(total: number, discount: Discount): boolean {
  if ("minCartTotal" in discount && discount.minCartTotal !== undefined) {
    return total >= discount.minCartTotal;
  }

  return true;
}

// ======================================================
// Test 5 / Test 6 - REFACTOR
// Extraction de la logique de calcul des promotions produit
// dans un helper dédié.
//
// Test 5 : buy one get one free
// Test 6 : application uniquement à certains types de produits
//
// ROUGE : le use case ne savait pas gérer les promotions produit.
//
// VERT : calcul du nombre d’articles offerts.
//
// REFACTOR : extraction dans calculateProductDiscount()
// pour séparer la logique métier du flux principal.
// ======================================================
function calculateProductDiscount(
  products: Product[],
  discount: ProductDiscount
): number {
  let totalDiscount = 0;

  for (const product of products) {
    const appliesToType =
      !discount.applicableProductTypes ||
      discount.applicableProductTypes.includes(product.type);

    if (!appliesToType) {
      continue;
    }

    const groupSize = discount.buyQuantity + discount.freeQuantity;
    const freeItems =
      Math.floor(product.quantity / groupSize) * discount.freeQuantity;

    totalDiscount += freeItems * product.price;
  }

  return totalDiscount;
}

// ======================================================
// Test 7 / Test 8 - REFACTOR
// Extraction de la règle de période Black Friday.
//
// Test 7 : la réduction s’applique pendant la période valide
// Test 8 : la réduction ne s’applique pas hors période
//
// ROUGE : le Black Friday n’était pas pris en compte.
//
// VERT : ajout d’un contrôle de date.
//
// REFACTOR : extraction dans isBlackFridayPeriod()
// pour clarifier l’intention métier.
// ======================================================
function isBlackFridayPeriod(now: Date): boolean {
  const start = new Date("2025-11-28T00:00:00");
  const end = new Date("2025-12-01T23:59:59");

  return now >= start && now <= end;
}

// ======================================================
// Test 7 / Test 9 - REFACTOR
// Extraction de la logique d’application de Black Friday.
//
// Test 7 : appliquer -50%
// Test 9 : ne jamais descendre sous 1 euro
//
// ROUGE : aucun calcul Black Friday n’existait.
//
// VERT : réduction de 50% du total.
//
// REFACTOR : extraction dans applyBlackFriday()
// avec garde-fou à minimum 1 euro.
// ======================================================
function applyBlackFriday(total: number): { newTotal: number; discount: number } {
  const newTotal = Math.max(1, total / 2);
  const discount = total - newTotal;

  return {
    newTotal,
    discount,
  };
}

export class CalculatePriceUseCase {
  constructor(private readonly notificationService: NotificationService) {}

  execute(
    products: Product[],
    discounts: Discount[],
    now: Date
  ): PriceSummary {
    // ======================================================
    // Test 1 - ROUGE
    // Le test échouait car la méthode execute() n’était pas implémentée.
    //
    // Test 1 - VERT
    // Implémentation minimale :
    // - calcul du sous-total
    // - retour d’un résultat sans remise
    // - notification du prix final
    //
    // Test 1 - REFACTOR
    // Le calcul du sous-total est resté volontairement simple
    // avec reduce() pour garder un code lisible.
    // ======================================================
    const subtotal = products.reduce((sum, product) => {
      return sum + product.price * product.quantity;
    }, 0);

    let total = subtotal;
    let standardDiscount = 0;
    let productDiscount = 0;
    let blackFridayDiscount = 0;

    // ======================================================
    // Test 5 - REFACTOR
    // Séparation des réductions en trois groupes :
    // - promotions produit
    // - promotions standard (fixe / pourcentage)
    // - promotions Black Friday
    //
    // Ce refactor permet de rendre explicite l’ordre métier :
    // produit -> standard -> Black Friday
    // ======================================================
    const productDiscounts = discounts.filter(
      (discount): discount is ProductDiscount => discount.type === "PRODUCT"
    );

    const standardDiscounts = discounts.filter(
      (discount): discount is PercentageDiscount | FixedDiscount =>
        discount.type === "PERCENTAGE" || discount.type === "FIXED"
    );

    const blackFridayDiscounts = discounts.filter(
      (discount): discount is BlackFridayDiscount =>
        discount.type === "BLACK_FRIDAY"
    );

    // ======================================================
    // Test 5 - ROUGE
    // Le test "buy one get one free" échouait car aucune
    // réduction produit n’était encore gérée.
    //
    // Test 5 - VERT
    // Application des promotions produit avant les autres réductions.
    //
    // Test 5 - REFACTOR
    // Le calcul détaillé a été extrait dans calculateProductDiscount().
    // ======================================================
    for (const discount of productDiscounts) {
      if (!isDiscountEligible(total, discount)) {
        continue;
      }

      const appliedDiscount = calculateProductDiscount(products, discount);

      total = Math.max(0, total - appliedDiscount);
      productDiscount += appliedDiscount;
    }

    // ======================================================
    // Test 2 - ROUGE
    // Le test de réduction fixe échouait car aucune remise fixe
    // n’était encore appliquée.
    //
    // Test 2 - VERT
    // Application d’une réduction fixe sur le total courant.
    //
    // Test 2 - REFACTOR
    // Utilisation de Math.min() pour éviter un total négatif.
    //
    // Test 3 - ROUGE
    // Le test de réduction en pourcentage échouait car
    // ce type de réduction n’était pas encore pris en charge.
    //
    // Test 3 - VERT
    // Application du pourcentage sur le total courant.
    //
    // Test 3 - REFACTOR
    // Les réductions FIXED et PERCENTAGE ont été regroupées
    // dans une seule boucle car elles appartiennent au même
    // ordre métier : les promotions standard.
    //
    // Test 4 - ROUGE
    // Une réduction s’appliquait même si minCartTotal
    // n’était pas atteint.
    //
    // Test 4 - VERT
    // Vérification de l’éligibilité avant application.
    //
    // Test 4 - REFACTOR
    // La logique a été extraite dans isDiscountEligible().
    // ======================================================
    for (const discount of standardDiscounts) {
      if (!isDiscountEligible(total, discount)) {
        continue;
      }

      if (discount.type === "FIXED") {
        const appliedDiscount = Math.min(discount.value, total);

        total -= appliedDiscount;
        standardDiscount += appliedDiscount;
      }

      if (discount.type === "PERCENTAGE") {
        const appliedDiscount = (total * discount.value) / 100;

        total -= appliedDiscount;
        standardDiscount += appliedDiscount;
      }
    }

    // ======================================================
    // Test 7 - ROUGE
    // Le test Black Friday échouait car la réduction n’était
    // pas encore appliquée.
    //
    // Test 7 - VERT
    // Application de Black Friday après toutes les autres promotions.
    //
    // Test 7 - REFACTOR
    // Extraction de la logique de date et du calcul dans
    // isBlackFridayPeriod() et applyBlackFriday().
    //
    // Test 8 - ROUGE
    // Le Black Friday pouvait potentiellement s’appliquer
    // en dehors de la période autorisée.
    //
    // Test 8 - VERT
    // Contrôle de la date courante avant application.
    //
    // Test 9 - ROUGE
    // Le total pouvait potentiellement descendre sous 1 euro.
    //
    // Test 9 - VERT
    // Ajout du minimum de 1 euro dans applyBlackFriday().
    // ======================================================
    for (const discount of blackFridayDiscounts) {
      if (!isBlackFridayPeriod(now)) {
        continue;
      }

      const result = applyBlackFriday(total);

      total = result.newTotal;
      blackFridayDiscount += result.discount;
    }

    // ======================================================
    // Test 10 - ROUGE
    // Le comportement complet n’était pas garanti tant que
    // l’ordre métier n’était pas rendu explicite.
    //
    // Test 10 - VERT
    // L’ordre d’application est désormais :
    // 1. promotions produit
    // 2. promotions standard
    // 3. Black Friday
    //
    // Test 10 - REFACTOR
    // L’ordre est visible directement dans la structure
    // du use case grâce aux trois boucles successives.
    // ======================================================
    const result: PriceSummary = {
      subtotal,
      productDiscount,
      standardDiscount,
      blackFridayDiscount,
      finalTotal: Number(total.toFixed(2)),
    };

    // ======================================================
    // Test 1 - notification
    // Le use case envoie le prix final au service de notification.
    // Dans les tests, cette dépendance est remplacée par un mock/spy
    // via vi.fn() pour vérifier qu’elle est bien appelée.
    // ======================================================
    this.notificationService.notifyFinalPrice(result.finalTotal);

    return result;
  }
}