import { ModuleInput } from '@unchainedshop/types/common';
import { CountriesModule, Country } from '@unchainedshop/types/countries';
import { emit, registerEvents } from 'meteor/unchained:events';
import { generateDbMutations } from 'meteor/unchained:utils';
import { CountriesCollection } from '../db/AssortmentsCollection';
import { CountrySchema } from '../db/AssortmentsSchema';
import countryFlags from 'emoji-flags';
import countryI18n from 'i18n-iso-countries';
import { systemLocale } from 'meteor/unchained:utils';

const COUNTRY_EVENTS: string[] = [
  'COUNTRY_CREATE',
  'COUNTRY_UPDATE',
  'COUNTRY_REMOVE',
];

type FindQuery = {
  includeInactive?: boolean;
};
const buildFindSelector = ({ includeInactive = false }: FindQuery) => {
  const selector: { isActive?: true } = {};
  if (!includeInactive) selector.isActive = true;
  return selector;
};

export const configureCountriesModule = async ({
  db,
}: ModuleInput): Promise<CountriesModule> => {
  registerEvents(COUNTRY_EVENTS);

  const Countries = await CountriesCollection(db);

  const mutations = generateDbMutations<Country>(Countries, CountrySchema);

  return {
    findCountry: async ({ countryId, isoCode }) => {
      return await Countries.findOne(
        countryId ? { _id: countryId } : { isoCode }
      );
    },

    findCountries: async ({ limit, offset, includeInactive }) => {
      const countries = await Countries.find(
        buildFindSelector({ includeInactive }),
        {
          skip: offset,
          limit,
        }
      );
      return countries.toArray();
    },

    count: async (query) => {
      const count = await Countries.find(buildFindSelector(query)).count();
      return count;
    },

    countryExists: async ({ countryId }) => {
      const countryCount = await Countries.find(
        { _id: countryId },
        { limit: 1 }
      ).count();
      return !!countryCount;
    },

    name(language) {
      return countryI18n.getName(this.isoCode, language) || language;
    },
    flagEmoji() {
      return countryFlags.countryCode(this.isoCode).emoji || '❌';
    },
    isBase() {
      return this.isoCode === systemLocale.country;
    },

    create: async (doc: Country, userId?: string) => {
      const countryId = await mutations.create(doc, userId);
      emit('COUNTRY_CREATE', { countryId });
      return countryId;
    },
    update: async (_id: string, doc: Country, userId?: string) => {
      const countryId = await mutations.update(_id, doc, userId);
      emit('COUNTRY_UPDATE', { countryId });
      return countryId;
    },
    delete: async (countryId) => {
      const deletedCount = await mutations.delete(countryId);
      emit('COUNTRY_REMOVE', { countryId });
      return deletedCount;
    },
  };
};
