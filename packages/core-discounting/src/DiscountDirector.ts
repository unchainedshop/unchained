import { log } from 'meteor/unchained:logger';
import { DiscountAdapter, DiscountContext } from './DiscountAdapter';

type IDiscountAdapter = typeof DiscountAdapter

export class DiscountDirector {
  public context: DiscountContext;

  constructor(context: DiscountContext) {
    this.context = context;
  }

  interfaceClass(discountKey: string) {
    // eslint-disable-line
    return DiscountDirector.adapters.get(discountKey);
  }

  interface(discountKey: string) {
    const AdapterClass = this.interfaceClass(discountKey);
    if (!AdapterClass) return null;
    const adapter = new AdapterClass({ context: this.context });
    return adapter;
  }

  async resolveDiscountKeyFromStaticCode(options) {
    if (!this.context.order) return [];
    log(
      `DiscountDirector -> Find user discount for static code ${options?.code}`
    );
    const discounts = await Promise.all(
      DiscountDirector.sortedAdapters()
        .filter((AdapterClass) =>
          AdapterClass.isManualAdditionAllowed(options?.code)
        )
        .map(async (AdapterClass) => {
          const adapter = new AdapterClass({ context: this.context });
          return {
            key: AdapterClass.key,
            isValid: await adapter.isValidForCodeTriggering(options),
          };
        })
    );

    return discounts.find(({ isValid }) => isValid === true)?.key;
  }

  async findSystemDiscounts(options) {
    if (!this.context.order) return [];
    const discounts = await Promise.all(
      DiscountDirector.sortedAdapters().map(async (AdapterClass) => {
        const adapter = new AdapterClass({ context: this.context });
        return {
          key: AdapterClass.key,
          isValid: await adapter.isValidForSystemTriggering(options),
        };
      })
    );
    const validDiscounts = discounts
      .filter(({ isValid }) => isValid === true)
      .map(({ key }) => key);
    if (validDiscounts.length > 0) {
      log(
        `DiscountDirector -> Found ${validDiscounts.length} system discounts`
      );
    }
    return validDiscounts;
  }

  static adapters = new Map<string, IDiscountAdapter>();

  static sortedAdapters() {
    return Array.from(DiscountDirector.adapters)
      .map((entry) => entry[1])
      .sort((left, right) => left.orderIndex - right.orderIndex);
  }

  static registerAdapter(adapter: IDiscountAdapter) {
    log(
      `${this.name} -> Registered ${adapter.key} ${adapter.version} (${adapter.label})`
    );
    DiscountDirector.adapters.set(adapter.key, adapter);
  }
}
