import { describe, it, expect, vi } from "vitest";
import {
  CalculatePriceUseCase,
  type Product,
  type Discount,
} from "../app/calcul-price.usecase";


describe("CalculatePriceUseCase", () => {
  // ======================================================
  // Test 1
  // Ce test vérifie que :
  // - le use case calcule correctement le sous-total du panier
  // - sans réduction, le total final est égal au sous-total
  // - le service de notification reçoit bien le prix final
  //
  // ROUGE :
  // Le use case n'était pas encore implémenté, donc le test
  // échouait car aucun calcul de sous-total n'était disponible.
  //
  // VERT :
  // Implémentation minimale du use case pour :
  // - calculer le sous-total
  // - retourner un total final identique au sous-total
  // - notifier le prix final
  //
  // REFACTOR :
  // Ce test protège le comportement de base du use case :
  // sans réduction, le total final doit être égal au sous-total.
  // ======================================================
  it("calculates subtotal without discount and notifies final price", () => {
    const notificationService = {
      // Mock / spy : on veut vérifier que la notification est bien envoyée
      notifyFinalPrice: vi.fn(),
    };

    const useCase = new CalculatePriceUseCase(notificationService);

    const products: Product[] = [
      {
        name: "T-shirt rouge",
        quantity: 2,
        type: "TSHIRT",
        price: 20,
      },
      {
        name: "Pull noir",
        quantity: 1,
        type: "PULL",
        price: 30,
      },
    ];

    const result = useCase.execute(products, [], new Date("2025-11-20"));

    expect(result.subtotal).toBe(70);
    expect(result.productDiscount).toBe(0);
    expect(result.standardDiscount).toBe(0);
    expect(result.blackFridayDiscount).toBe(0);
    expect(result.finalTotal).toBe(70);

    expect(notificationService.notifyFinalPrice).toHaveBeenCalledTimes(1);
    expect(notificationService.notifyFinalPrice).toHaveBeenCalledWith(70);
  });

  // ======================================================
  // Test 2
  // Ce test vérifie que :
  // - une réduction fixe est bien soustraite du total
  // - le montant de la réduction standard est correctement calculé
  // - le prix final notifié correspond bien au total après remise
  //
  // ROUGE :
  // Le use case ne gérait pas encore les réductions fixes,
  // donc le total final restait égal au sous-total.
  //
  // VERT :
  // Ajout du minimum de logique nécessaire pour soustraire
  // une valeur fixe au total courant.
  //
  // REFACTOR :
  // Ce test protège aussi la notification du montant final
  // après application d'une réduction fixe.
  // ======================================================
  it("applies a fixed discount and notifies the final price", () => {
    const notificationService = {
      notifyFinalPrice: vi.fn(),
    };

    const useCase = new CalculatePriceUseCase(notificationService);

    const products: Product[] = [
      {
        name: "T-shirt rouge",
        quantity: 2,
        type: "TSHIRT",
        price: 20,
      },
      {
        name: "Pull noir",
        quantity: 1,
        type: "PULL",
        price: 30,
      },
    ];

    const discounts: Discount[] = [
      {
        type: "FIXED",
        code: "LESS10",
        value: 10,
      },
    ];

    const result = useCase.execute(products, discounts, new Date("2025-11-20"));

    expect(result.subtotal).toBe(70);
    expect(result.standardDiscount).toBe(10);
    expect(result.finalTotal).toBe(60);

    expect(notificationService.notifyFinalPrice).toHaveBeenCalledWith(60);
  });

  // ======================================================
  // Test 3
  // Ce test vérifie que :
  // - une réduction en pourcentage est bien appliquée au total du panier
  // - le montant de la remise calculée est correct
  // - le prix final envoyé au service de notification est le bon
  //
  // ROUGE :
  // Le use case ne savait pas encore appliquer une réduction
  // en pourcentage sur le total du panier.
  //
  // VERT :
  // Ajout de la logique minimale pour calculer et appliquer
  // un pourcentage sur le total courant.
  //
  // REFACTOR :
  // Ce test garantit que le calcul en pourcentage reste correct
  // même après réorganisation interne de la boucle standard.
  // ======================================================
  it("applies a percentage discount and notifies the final price", () => {
    const notificationService = {
      notifyFinalPrice: vi.fn(),
    };

    const useCase = new CalculatePriceUseCase(notificationService);

    const products: Product[] = [
      {
        name: "T-shirt rouge",
        quantity: 2,
        type: "TSHIRT",
        price: 20,
      },
      {
        name: "Pull noir",
        quantity: 1,
        type: "PULL",
        price: 30,
      },
    ];

    const discounts: Discount[] = [
      {
        type: "PERCENTAGE",
        code: "TENOFF",
        value: 10,
      },
    ];

    const result = useCase.execute(products, discounts, new Date("2025-11-20"));

    expect(result.subtotal).toBe(70);
    expect(result.standardDiscount).toBe(7);
    expect(result.finalTotal).toBe(63);

    expect(notificationService.notifyFinalPrice).toHaveBeenCalledWith(63);
  });

  // ======================================================
  // Test 4
  // Ce test vérifie que :
  // - la réduction ne s’applique pas si le panier n’atteint pas minCartTotal
  // - le total final reste inchangé quand la condition n’est pas remplie
  // - aucune remise standard n’est comptabilisée à tort
  //
  // ROUGE :
  // La réduction était appliquée même lorsque le total du panier
  // n’atteignait pas le seuil minimum minCartTotal.
  //
  // VERT :
  // Ajout d’une vérification d’éligibilité avant application
  // de la réduction.
  //
  // REFACTOR :
  // Ce test protège la règle métier minCartTotal et justifie
  // l’extraction du helper isDiscountEligible().
  // ======================================================
  it("does not apply a discount when minCartTotal is not reached", () => {
    const notificationService = {
      notifyFinalPrice: vi.fn(),
    };

    const useCase = new CalculatePriceUseCase(notificationService);

    const products: Product[] = [
      {
        name: "T-shirt rouge",
        quantity: 1,
        type: "TSHIRT",
        price: 20,
      },
    ];

    const discounts: Discount[] = [
      {
        type: "PERCENTAGE",
        code: "TENOFF",
        value: 10,
        minCartTotal: 30,
      },
    ];

    const result = useCase.execute(products, discounts, new Date("2025-11-20"));

    expect(result.subtotal).toBe(20);
    expect(result.standardDiscount).toBe(0);
    expect(result.finalTotal).toBe(20);

    expect(notificationService.notifyFinalPrice).toHaveBeenCalledWith(20);
  });

  // ======================================================
  // Test 5
  // Ce test vérifie que :
  // - une promotion produit de type "1 acheté = 1 offert" est bien appliquée
  // - le montant de la remise produit est correctement calculé
  // - le total final correspond bien au panier après article offert
  //
  // ROUGE :
  // Le use case ne gérait pas encore les promotions produit
  // du type "1 acheté = 1 offert".
  //
  // VERT :
  // Ajout du minimum nécessaire pour calculer le nombre
  // d’articles gratuits et la remise associée.
  //
  // REFACTOR :
  // Ce test protège la logique de base des promotions produit
  // et justifie l’extraction du helper calculateProductDiscount().
  // ======================================================
  it("applies a product discount buy one get one free", () => {
    const notificationService = {
      notifyFinalPrice: vi.fn(),
    };

    const useCase = new CalculatePriceUseCase(notificationService);

    const products: Product[] = [
      {
        name: "T-shirt rouge",
        quantity: 2,
        type: "TSHIRT",
        price: 20,
      },
    ];

    const discounts: Discount[] = [
      {
        type: "PRODUCT",
        code: "BOGO",
        buyQuantity: 1,
        freeQuantity: 1,
        applicableProductTypes: ["TSHIRT"],
      },
    ];

    const result = useCase.execute(products, discounts, new Date("2025-11-20"));

    expect(result.subtotal).toBe(40);
    expect(result.productDiscount).toBe(20);
    expect(result.finalTotal).toBe(20);

    expect(notificationService.notifyFinalPrice).toHaveBeenCalledWith(20);
  });

  // ======================================================
  // Test 6
  // Ce test vérifie que :
  // - une promotion produit ne s’applique qu’aux types autorisés
  // - les autres produits du panier ne reçoivent aucune remise par erreur
  // - seul le sous-ensemble ciblé est pris en compte dans le calcul
  //
  // ROUGE :
  // Une promotion produit pouvait être appliquée à tort
  // sur tous les articles du panier, même hors périmètre.
  //
  // VERT :
  // Ajout d’un filtre sur applicableProductTypes.
  //
  // REFACTOR :
  // Ce test garantit que les promotions produit ne s’appliquent
  // qu’aux types explicitement autorisés.
  // ======================================================
  it("applies product discount only on applicable product types", () => {
    const notificationService = {
      notifyFinalPrice: vi.fn(),
    };

    const useCase = new CalculatePriceUseCase(notificationService);

    const products: Product[] = [
      {
        name: "T-shirt rouge",
        quantity: 2,
        type: "TSHIRT",
        price: 20,
      },
      {
        name: "Pull noir",
        quantity: 2,
        type: "PULL",
        price: 30,
      },
    ];

    const discounts: Discount[] = [
      {
        type: "PRODUCT",
        code: "BOGO",
        buyQuantity: 1,
        freeQuantity: 1,
        applicableProductTypes: ["TSHIRT"],
      },
    ];

    const result = useCase.execute(products, discounts, new Date("2025-11-20"));

    expect(result.subtotal).toBe(100);
    expect(result.productDiscount).toBe(20);
    expect(result.finalTotal).toBe(80);

    expect(notificationService.notifyFinalPrice).toHaveBeenCalledWith(80);
  });

  // ======================================================
  // Test 7
  // Ce test vérifie que :
  // - Black Friday applique bien 50% de remise sur le total courant
  // - la remise Black Friday est correctement remontée dans le résultat
  // - le prix final notifié correspond bien au total après Black Friday
  //
  // ROUGE :
  // Le Black Friday n’était pas encore pris en charge,
  // donc aucune réduction de 50% n’était appliquée.
  //
  // VERT :
  // Ajout de la logique minimale pour appliquer Black Friday
  // après les autres promotions.
  //
  // REFACTOR :
  // Ce test protège le calcul Black Friday et justifie
  // l’extraction des helpers isBlackFridayPeriod()
  // et applyBlackFriday().
  // ======================================================
  it("applies Black Friday discount during valid period", () => {
    const notificationService = {
      notifyFinalPrice: vi.fn(),
    };

    const useCase = new CalculatePriceUseCase(notificationService);

    const products: Product[] = [
      {
        name: "Pull noir",
        quantity: 1,
        type: "PULL",
        price: 100,
      },
    ];

    const discounts: Discount[] = [
      {
        type: "BLACK_FRIDAY",
        code: "BF2025",
      },
    ];

    const result = useCase.execute(
      products,
      discounts,
      new Date("2025-11-29T12:00:00")
    );

    expect(result.subtotal).toBe(100);
    expect(result.blackFridayDiscount).toBe(50);
    expect(result.finalTotal).toBe(50);

    expect(notificationService.notifyFinalPrice).toHaveBeenCalledWith(50);
  });

  // ======================================================
  // Test 8
  // Ce test vérifie que :
  // - Black Friday ne s’applique pas hors de sa fenêtre de validité
  // - aucune remise Black Friday n’est comptabilisée hors période
  // - le total final reste identique au sous-total en dehors des dates prévues
  //
  // ROUGE :
  // Sans contrôle de date, Black Friday pouvait s’appliquer
  // en dehors de la période autorisée.
  //
  // VERT :
  // Ajout d’un contrôle de période avant application.
  //
  // REFACTOR :
  // Ce test protège la règle métier temporelle du Black Friday.
  // ======================================================
  it("does not apply Black Friday discount outside valid period", () => {
    const notificationService = {
      notifyFinalPrice: vi.fn(),
    };

    const useCase = new CalculatePriceUseCase(notificationService);

    const products: Product[] = [
      {
        name: "Pull noir",
        quantity: 1,
        type: "PULL",
        price: 100,
      },
    ];

    const discounts: Discount[] = [
      {
        type: "BLACK_FRIDAY",
        code: "BF2025",
      },
    ];

    const result = useCase.execute(products, discounts, new Date("2025-11-20"));

    expect(result.blackFridayDiscount).toBe(0);
    expect(result.finalTotal).toBe(100);

    expect(notificationService.notifyFinalPrice).toHaveBeenCalledWith(100);
  });

  // ======================================================
  // Test 9
  // Ce test vérifie que :
  // - Black Friday ne peut jamais faire tomber le total sous 1 euro
  // - quand le panier vaut déjà 1 euro, aucune remise supplémentaire n’est appliquée
  // - la contrainte métier minimum 1 euro est bien respectée
  //
  // ROUGE :
  // Le Black Friday pouvait théoriquement faire descendre
  // le total sous 1 euro.
  //
  // VERT :
  // Ajout d’un garde-fou pour bloquer le total minimum à 1 euro.
  //
  // REFACTOR :
  // Ce test protège la contrainte métier spécifique au Black Friday.
  // ======================================================
  it("does not allow Black Friday to reduce total below 1 euro", () => {
    const notificationService = {
      notifyFinalPrice: vi.fn(),
    };

    const useCase = new CalculatePriceUseCase(notificationService);

    const products: Product[] = [
      {
        name: "T-shirt rouge",
        quantity: 1,
        type: "TSHIRT",
        price: 1,
      },
    ];

    const discounts: Discount[] = [
      {
        type: "BLACK_FRIDAY",
        code: "BF2025",
      },
    ];

    const result = useCase.execute(
      products,
      discounts,
      new Date("2025-11-29T12:00:00")
    );

    expect(result.blackFridayDiscount).toBe(0);
    expect(result.finalTotal).toBe(1);

    expect(notificationService.notifyFinalPrice).toHaveBeenCalledWith(1);
  });

  // ======================================================
  // Test 10
  // Ce test vérifie que :
  // - les promotions sont appliquées dans l’ordre métier attendu
  // - la promotion produit est appliquée avant la remise standard
  // - Black Friday est appliqué en dernier sur le total déjà réduit
  // - le détail de chaque remise reste cohérent dans le résultat final
  //
  // ROUGE :
  // Même si chaque promotion fonctionnait séparément,
  // l’ordre métier global n’était pas encore garanti.
  //
  // VERT :
  // Mise en place de l’ordre d’application attendu :
  // 1. promotions produit
  // 2. promotions standard
  // 3. Black Friday
  //
  // REFACTOR :
  // Ce test protège l’ordre métier global et sécurise
  // le découpage du use case en trois étapes successives.
  // ======================================================
  it("applies promotions in the correct business order", () => {
    const notificationService = {
      notifyFinalPrice: vi.fn(),
    };

    const useCase = new CalculatePriceUseCase(notificationService);

    const products: Product[] = [
      {
        name: "T-shirt rouge",
        quantity: 2,
        type: "TSHIRT",
        price: 50,
      },
    ];

    const discounts: Discount[] = [
      {
        type: "PERCENTAGE",
        code: "TENOFF",
        value: 10,
      },
      {
        type: "PRODUCT",
        code: "BOGO",
        buyQuantity: 1,
        freeQuantity: 1,
        applicableProductTypes: ["TSHIRT"],
      },
      {
        type: "BLACK_FRIDAY",
        code: "BF2025",
      },
    ];

    const result = useCase.execute(
      products,
      discounts,
      new Date("2025-11-29T12:00:00")
    );

    expect(result.subtotal).toBe(100);
    expect(result.productDiscount).toBe(50);
    expect(result.standardDiscount).toBe(5);
    expect(result.blackFridayDiscount).toBe(22.5);
    expect(result.finalTotal).toBe(22.5);

    expect(notificationService.notifyFinalPrice).toHaveBeenCalledWith(22.5);
  });
});