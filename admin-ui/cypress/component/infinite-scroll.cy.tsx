import InfiniteScroll from '../../src/modules/common/components/InfiniteScroll.tsx';

const mountWithObserver = () => {
  let callback: IntersectionObserverCallback;
  let sentinel: Element;
  const observer = {
    observe: cy.stub().callsFake((target: Element) => {
      sentinel = target;
    }),
    disconnect: cy.stub(),
    unobserve: cy.stub(),
    takeRecords: () => [],
    root: null,
    rootMargin: '200px',
    thresholds: [0],
  } as IntersectionObserver;
  const onLoadMore = cy.stub().as('loadMore');

  // Imported components execute in the spec window, while their DOM is mounted
  // in Cypress's application iframe.
  cy.stub(globalThis, 'IntersectionObserver').callsFake(
    (listener: IntersectionObserverCallback) => {
      callback = listener;
      return observer;
    },
  );

  cy.mount(
    <InfiniteScroll loading={false} hasMore onLoadMore={onLoadMore}>
      <div>First page</div>
    </InfiniteScroll>,
  );

  return (intersections: boolean[]) => {
    cy.wrap(observer.observe).should('have.been.calledOnce');
    cy.then(() => {
      expect(sentinel.isConnected).to.equal(true);
      const bounds = sentinel.getBoundingClientRect();
      const entries = intersections.map((isIntersecting, index) => ({
        target: sentinel,
        time: index + 1,
        isIntersecting,
        intersectionRatio: isIntersecting ? 1 : 0,
        boundingClientRect: bounds,
        intersectionRect: isIntersecting ? bounds : new DOMRect(),
        rootBounds: null,
      }));

      callback(entries, observer);
    });
  };
};

describe('batched infinite-scroll intersections', () => {
  it('loads once when the sentinel enters the viewport at the end of a batch', () => {
    const deliverIntersections = mountWithObserver();

    deliverIntersections([false, true]);

    cy.get('@loadMore').should('have.been.calledOnce');
  });

  it('does not load when the sentinel leaves the viewport at the end of a batch', () => {
    const deliverIntersections = mountWithObserver();

    deliverIntersections([true, false]);

    cy.get('@loadMore').should('not.have.been.called');
  });
});
