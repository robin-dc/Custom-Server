const http = require('http');
const fs = require('fs');

const allProducts = [
    {
        id: 1,
        category: 'Beauty',
        name: 'Shampoo',
        description: 'Make your hair silky',
        reviews: ['Nice product!', 'Love this.']
    },
    {
        id: 2,
        category: 'Beauty',
        name: 'Facial Cleanser',
        description: 'Make your hair silky',
        reviews: ['Nice product!', 'Love this.']
    }
]

let nextId = 3;

function getNewId() {
  const newId = nextId;
  nextId++;
  return newId;
}


const server = http.createServer(async (req,res) => {
    console.log(req.method, req.url);
    if (req.method === "GET" && req.url.startsWith('/assets')) {    //<= translate assets into readable format
        const assetPath = req.url.split("/assets")[1];

        try {
            const resBody = fs.readFileSync("server/assets" + assetPath);
            res.statusCode = 200;
            res.setHeader("Content-Type", getContentType(assetPath));
            res.write(resBody);
            return res.end();
        } catch {
            console.error("Cannot find asset", assetPath, "in assets folder");
        }

    }

    // ============================================= THIS CODE IS REQUIRED ==========================================
    function parseRequestBody(req) {
      return new Promise((resolve, reject) => {
        let reqBody = "";
        req.on("data", (data) => {
          reqBody += data;
        });

        req.on("end", () => {
          if (reqBody) {
            const parsedBody = reqBody
              .split("&")
              .map((keyValuePair) => keyValuePair.split("="))
              .map(([key, value]) => [key, value.replace(/\+/g, " ")])
              .map(([key, value]) => [key, decodeURIComponent(value)])
              .reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
              }, {});

            resolve(parsedBody);
          } else {
            resolve({});
          }
        });

        req.on("error", (err) => {
          reject(err);
        });
      });
    }

    // =============================================================================================================

    // GO TO HOMEPAGE
    if (req.method === 'GET' && req.url === '/') {
        const indexPath = fs.readFileSync("server/views/index.html", 'utf-8');

        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html");
        res.write(indexPath);
        return res.end();
    }

    // GO TO ALL PRODUCTS
    if (req.method === 'GET' && req.url === '/products') {
      console.log(allProducts)
        const allProductsPath = fs.readFileSync("server/views/products.html", 'utf-8');

        const resBody = allProductsPath
        .replace(/#{products}/g, allProducts.map(product => `<li><a href="/products/${product.id}">${product.name}</a></li>`).join(""))

        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html");
        res.write(resBody);
        return res.end();
    }

    // GO TO PRODUCT DETAILS
    if (req.method === 'GET' && req.url.startsWith('/products/')) {
      const urlParts = req.url.split('/');
      if(urlParts.length === 3){
        const productId = urlParts[2]
        const product = allProducts.find(product => product.id === Number(productId))
        if(!productId){
          const errorPath = fs.readFileSync("server/views/error.html", "utf8");
          const resBody = errorPath
          .replace(/#{error}/g, "404 NOT FOUND")

          res.statusCode = 404;
          return res.end(resBody);
        }
        let productDetailPath = fs.readFileSync('server/views/product-detail.html', 'utf8');
        let resBody = productDetailPath
        .replace(/#{name}/g, product.name)
        .replace(/#{id}/g, product.id)
        .replace(/#{category}/g, product.category)
        .replace(/#{description}/g, product.description)
        .replace(/#{reviews}/g, product.reviews.map(review => `<li>${review}</li>`).join(""))

        res.statusCode = 200
        res.setHeader('Content-Type', 'text/html')
        res.end(resBody)
        return
      }
    }

    //  GO TO CREATE PRODUCT FORM
    if (req.method === 'GET' && req.url === '/create') {
      const indexPath = fs.readFileSync("server/views/create-product.html", 'utf-8');

      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html");
      res.write(indexPath);
      return res.end();
    }

    // ADD NEW PRODUCT
    if (req.method === 'POST' && req.url === '/product') {
      try {
        const newId = getNewId()
        const requestBody = await parseRequestBody(req);
        allProducts.push({id: newId, ...requestBody, reviews: [] });
        console.log(allProducts);

        res.statusCode = 302;
        res.setHeader('Location', '/products');
        return res.end();
      } catch (error) {
        const errorPath = fs.readFileSync("server/views/error.html", "utf8");
        const resBody = errorPath
        .replace(/#{error}/g, (error.message).toUpperCase())

        res.statusCode = 500;
        return res.end(resBody);
      }
    }

    // ADD NEW REVIEW TO A PRODUCT
    if(req.method === 'POST' && req.url.startsWith('/products/') && req.url.endsWith('/review')){
      try {
        const urlParts = req.url.split('/');
        if(urlParts.length === 4){
          const requestBody = await parseRequestBody(req);
          const productId = urlParts[2]
          if(!productId){
            const errorPath = fs.readFileSync("server/views/error.html", "utf8");
            const resBody = errorPath
            .replace(/#{error}/g, "404 NOT FOUND")

            res.statusCode = 404;
            return res.end(resBody);
          }
          const product = allProducts.find(product => product.id === Number(productId))
          console.log('added', product)
          product.reviews.push(requestBody.review)


          const productUrl = req.url.split('/review')[0];
          console.log(productUrl)
          res.statusCode = 302;
          res.setHeader('Location', `${productUrl}`);
          return res.end();
        }

      } catch (error) {
        const errorPath = fs.readFileSync("server/views/error.html", "utf8");
        const resBody = errorPath
        .replace(/#{error}/g, (error.message).toUpperCase())

        res.statusCode = 500;
        return res.end(resBody);
      }
    }

    // IF NOT EXISITNG URL
    const errorPath = fs.readFileSync("server/views/error.html", "utf8");
    const resBody = errorPath
    .replace(/#{error}/g, "404 NOT FOUND")

    res.statusCode = 404;
    return res.end(resBody);
})





const port = 5000

server.listen(port, () => {
    console.log(`listening on port ${port}`)
})







function getContentType(fileName) {
    const ext = fileName.split(".")[1];
    switch (ext) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "css":
        return "text/css";
      default:
        return "text/plain";
    }
  }
