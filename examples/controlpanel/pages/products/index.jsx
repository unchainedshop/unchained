import React from "react";
import { Container } from "semantic-ui-react";
import { withRouter } from "next/router";
import App from "../../components/App";
import ProductList from "../../components/products/ProductList";
import connectApollo from "../../lib/connectApollo";

export default connectApollo(
  withRouter(({ router, ...rest }) => {
    return (
      <App {...rest}>
        <Container>
          <h2>Products</h2>
          <ProductList router={router}/>
        </Container>
      </App>
    );
  })
);
