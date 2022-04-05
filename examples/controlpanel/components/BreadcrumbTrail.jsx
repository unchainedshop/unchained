import React from 'react';
import { Breadcrumb } from 'semantic-ui-react';

const BreadcrumbTrail = ({ assortmentPaths, router }) => {
  return (
    <Breadcrumb>
      {assortmentPaths.map((path, pathIndex) =>
        path.links.map((link, linkIndex) => (
          <>
            {pathIndex > 0 && linkIndex === 0 && <br key="link.assortmentId" />}
            <Breadcrumb.Section
              key={link.assortmentId}
              onClick={() => {
                router.push({
                  pathname: '/assortments/edit',
                  query: { _id: link.assortmentId },
                });
              }}
              link
            >
              {link.assortmentTexts?.title}
            </Breadcrumb.Section>
            {path.links.length !== linkIndex + 1 && <Breadcrumb.Divider />}
          </>
        )),
      )}
    </Breadcrumb>
  );
};
export default BreadcrumbTrail;
