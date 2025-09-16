import { useIntl } from 'react-intl';
import {
  HeartIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  EyeIcon,
  CheckIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import Loading from '../modules/common/components/Loading';
import ThemeToggle from '../modules/common/components/ThemeToggle';
import LanguageToggle from '../modules/common/components/LanguageToggle';
import Button from '../modules/common/components/Button';
import DeleteButton from '../modules/common/components/DeleteButton';
import Badge from '../modules/common/components/Badge';
import TagList from '../modules/common/components/TagList';

const StyleGuidePage = () => {
  const { formatMessage } = useIntl();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
            Style Guide
          </h1>
          <div className="flex items-center space-x-4">
            <LanguageToggle narrowNav={false} />
            <ThemeToggle />
          </div>
        </div>

        <div className="space-y-12">
          {/* Loading Indicators */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Loading Indicators
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-4">
                Loading Indicators
              </h3>
              <Loading />
            </div>
          </section>

          {/* Colors */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Color Palette
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Light Theme Colors */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-4">
                  Slate Colors
                </h3>
                <div className="space-y-3">
                  {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map(
                    (shade) => (
                      <div key={shade} className="flex items-center space-x-3">
                        <div
                          className={`w-12 h-8 rounded border border-slate-300 dark:border-slate-600 bg-slate-${shade}`}
                        />
                        <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                          slate-{shade}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Status Colors */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-4">
                  Status Colors
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-8 rounded border border-slate-300 dark:border-slate-600 bg-lime-600" />
                    <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Confirmed</span> - lime-600
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-8 rounded border border-slate-300 dark:border-slate-600 bg-amber-600" />
                    <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Pending</span> - amber-600
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-8 rounded border border-slate-300 dark:border-slate-600 bg-sky-600" />
                    <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Open</span> - sky-600
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-8 rounded border border-slate-300 dark:border-slate-600 bg-emerald-600" />
                    <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Fulfilled</span> -
                      emerald-600
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-8 rounded border border-slate-300 dark:border-slate-600 bg-rose-600" />
                    <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Rejected/Error</span> -
                      rose-600
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-8 rounded border border-slate-300 dark:border-slate-600 bg-slate-600" />
                    <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                      <span className="font-medium">Default/Neutral</span> -
                      slate-600
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Badges */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Status Badges
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap gap-3">
                <Badge
                  text="CONFIRMED"
                  color="lime"
                  className="rounded-md uppercase"
                />
                <Badge
                  text="PENDING"
                  color="amber"
                  className="rounded-md uppercase"
                />
                <Badge
                  text="OPEN"
                  color="sky"
                  className="rounded-md uppercase"
                />
                <Badge
                  text="FULFILLED"
                  color="emerald"
                  className="rounded-md uppercase"
                />
                <Badge
                  text="REJECTED"
                  color="rose"
                  className="rounded-md uppercase"
                />
                <Badge
                  text="DEFAULT"
                  color="slate"
                  className="rounded-md uppercase"
                />
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Badge Variations
                </h4>
                <div className="flex flex-wrap gap-3">
                  <Badge text="With Dot" color="emerald" dotted />
                  <Badge text="Square Badge" color="amber" square />
                  <Badge
                    text="Closeable"
                    color="rose"
                    onClick={() => alert('Badge closed!')}
                  />
                  <Badge text="Rounded" color="sky" />
                </div>
              </div>
            </div>
          </section>

          {/* TagList */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Tag Lists
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <div className="space-y-6">
                {/* TagList with tags */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    TagList with Tags
                  </h4>
                  <TagList
                    defaultValue={[
                      'Product',
                      'Electronics',
                      'Gaming',
                      'Accessories',
                    ]}
                    onSubmit={(tags) => console.log('Tags submitted:', tags)}
                    enableEdit={true}
                  />
                </div>

                {/* TagList without tags */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    TagList without Tags (Empty State)
                  </h4>
                  <TagList
                    defaultValue={[]}
                    onSubmit={(tags) => console.log('Tags submitted:', tags)}
                    enableEdit={true}
                  />
                </div>

                {/* TagList read-only */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    TagList Read-Only (No Edit Button)
                  </h4>
                  <TagList
                    defaultValue={['Read Only', 'Display Only', 'No Edit']}
                    onSubmit={(tags) => console.log('Tags submitted:', tags)}
                    enableEdit={false}
                  />
                </div>

                {/* TagList with many tags */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    TagList with Many Tags (Wrapping)
                  </h4>
                  <TagList
                    defaultValue={[
                      'Technology',
                      'Software',
                      'Development',
                      'Frontend',
                      'React',
                      'TypeScript',
                      'Tailwind CSS',
                      'UI/UX',
                      'Design System',
                      'Component Library',
                    ]}
                    onSubmit={(tags) => console.log('Tags submitted:', tags)}
                    enableEdit={true}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Typography */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Typography
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 space-y-4">
              <h1 className="text-4xl font-semibold text-slate-900 dark:text-slate-100">
                Heading 1 - 4xl Semibold
              </h1>
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                Heading 2 - 3xl Semibold
              </h2>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                Heading 3 - 2xl Semibold
              </h3>
              <h4 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Heading 4 - xl Semibold
              </h4>
              <h5 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                Heading 5 - lg Medium
              </h5>
              <h6 className="text-base font-medium text-slate-900 dark:text-slate-100">
                Heading 6 - base Medium
              </h6>
              <p className="text-base text-slate-600 dark:text-slate-400">
                Body text - Regular paragraph text with good readability and
                contrast.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                Small text - Used for captions, metadata, and secondary
                information.
              </p>
            </div>
          </section>

          {/* Buttons */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Button System
            </h2>
            <div className="space-y-8">
              {/* Button Variants */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-4">
                  Button Variants
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button variant="primary" text="Primary" />
                  <Button variant="secondary" text="Secondary" />
                  <Button variant="tertiary" text="Tertiary" />
                  <Button variant="quaternary" text="Quaternary" />
                  <Button variant="danger" text="Danger" />
                  <Button variant="ghost" text="Ghost" />
                  <Button variant="success" text="Success" />
                  <Button variant="neutral" text="Neutral" />
                  <Button variant="input" text="Input Style" />
                </div>
              </div>

              {/* Button Sizes */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-4">
                  Button Sizes
                </h3>
                <div className="flex items-end space-x-4">
                  <Button size="xs" text="Extra Small" />
                  <Button size="sm" text="Small" />
                  <Button size="md" text="Medium" />
                  <Button size="lg" text="Large" />
                </div>
              </div>

              {/* Button States */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-4">
                  Button States
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button text="Normal" />
                  <Button text="Disabled" disabled />
                  <Button text="Loading" loading />
                  <Button
                    text="With Icon"
                    icon={<PlusIcon className="w-4 h-4" />}
                  />
                </div>
              </div>

              {/* Button with Icons */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-4">
                  Buttons with Icons
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button
                    text="Add Item"
                    icon={<PlusIcon className="w-4 h-4" />}
                    variant="primary"
                  />
                  <Button
                    text="Delete"
                    icon={<TrashIcon className="w-4 h-4" />}
                    variant="danger"
                  />
                  <Button
                    text="Like"
                    iconRight={<HeartIcon className="w-4 h-4" />}
                    variant="ghost"
                  />
                </div>
              </div>

              {/* Button Shapes */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-4">
                  Button Shapes
                </h3>
                <div className="flex items-center space-x-4">
                  <Button text="Sharp" rounded="none" />
                  <Button text="Small Radius" rounded="sm" />
                  <Button text="Default" rounded="md" />
                  <Button text="Large Radius" rounded="lg" />
                  <Button text="Pill" rounded="full" />
                </div>
              </div>

              {/* Full Width Button */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-4">
                  Full Width Button
                </h3>
                <Button text="Full Width Button" fullWidth />
              </div>

              {/* Application Style Buttons */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-4">
                  Application Style Buttons
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  <Button
                    variant="success"
                    icon={<CheckIcon className="h-4 w-4" />}
                    iconRight={<ChevronDownIcon className="h-4 w-4" />}
                    text="Activated"
                    rounded="lg"
                  />
                  <Button
                    variant="neutral"
                    icon={<CheckIcon className="h-4 w-4" />}
                    iconRight={<ChevronDownIcon className="h-4 w-4" />}
                    text="Root"
                    rounded="lg"
                  />
                  <div className="flex items-center gap-2">
                    <Button variant="input" text="Display Order" rounded="lg" />
                    <Button
                      variant="input"
                      text="10"
                      size="sm"
                      rounded="lg"
                      className="w-16"
                    />
                  </div>
                  <Button
                    variant="secondary"
                    text="Mark as Base"
                    rounded="lg"
                  />
                  <Button
                    variant="danger"
                    icon={<XMarkIcon className="h-4 w-4" />}
                    text="Delete"
                    rounded="lg"
                  />
                </div>
              </div>

              {/* Specialized Buttons */}
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-4">
                  Specialized Icon Buttons
                </h3>
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col items-center space-y-2">
                    <DeleteButton onClick={() => alert('Delete clicked!')} />
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Default Delete
                    </span>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <DeleteButton
                      onClick={() => alert('Close clicked!')}
                      icon={<XMarkIcon className="h-5 w-5" />}
                      ariaLabel="Close"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Close Button
                    </span>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <DeleteButton
                      onClick={() => alert('View clicked!')}
                      icon={<EyeIcon className="h-5 w-5" />}
                      ariaLabel="View"
                      className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Custom Icon
                    </span>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <DeleteButton
                      onClick={() => alert('Custom clicked!')}
                      textLeft="X"
                      icon={null}
                      ariaLabel="Custom text"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Text Only
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Form Elements */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Form Elements
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Text Input
                </label>
                <input
                  type="text"
                  placeholder="Enter text here..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-400 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select
                </label>
                <select className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-400 focus:border-transparent">
                  <option>Option 1</option>
                  <option>Option 2</option>
                  <option>Option 3</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Textarea
                </label>
                <textarea
                  placeholder="Enter longer text here..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-slate-800 dark:focus:ring-slate-400 focus:border-transparent"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="checkbox"
                  className="rounded border-slate-300 dark:border-slate-600 text-slate-800 focus:ring-slate-800 dark:focus:ring-slate-400"
                />
                <label
                  htmlFor="checkbox"
                  className="text-sm text-slate-700 dark:text-slate-300"
                >
                  Checkbox option
                </label>
              </div>
            </div>
          </section>

          {/* Theme Controls */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Theme Controls
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Theme Toggle:
                  </span>
                  <ThemeToggle />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Language Toggle:
                  </span>
                  <LanguageToggle narrowNav={false} />
                </div>
              </div>
            </div>
          </section>

          {/* Cards & Containers */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
              Cards & Containers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Standard Card
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  This is a standard card with border, shadow, and rounded
                  corners.
                </p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Elevated Card
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  This card has a larger shadow for more emphasis.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

StyleGuidePage.getLayout = (page) => page;

export default StyleGuidePage;
