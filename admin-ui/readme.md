This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

It's an incomplete sample storefront you can use as a starter for a small Web-Shop.

## Getting Started

Install dependencies:
```bash
npm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Change graphql endpoint
By default Admin UI tries to connect to `http://localhost:4010/graphql`. set `NEXT_PUBLIC_GRAPHQL_ENDPOINT` to a different value if you want to change it.

To do that only for local development, you can create a .env.local and add the ENV=value there.

## Change logo
Set company logo by using  `NEXT_PUBLIC_LOGO` to provide url of the logo


## Enable Local AI


```
brew install llama.cpp
llama-server -hf ggml-org/gpt-oss-20b-GGUF --ctx-size 0 --jinja -ub 2048 -b 2048
```

### on Linux (Ubuntu)
1. Install build dependencies
```
sudo apt update
sudo apt install -y build-essential cmake git
```
2. Clone and build llama.cpp
```
git clone https://github.com/ggerganov/llama.cpp.git
cd llama.cpp
mkdir build && cd build
cmake ..
cmake --build . --config Release
```
3. Download and Run Model

```
./bin/llama-server \
  -hf ggml-org/gpt-oss-20b-GGUF \
  --ctx-size 0 \
  --jinja \
  -ub 2048 \
  -b 2048

```
