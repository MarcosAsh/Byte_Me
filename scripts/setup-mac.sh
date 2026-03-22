#!/bin/bash
# setup for macOS
# installs java 17, maven, node 20, and postgres 16
# run with: chmod +x setup-mac.sh && ./setup-mac.sh

set -e

NODE_VERSION="20"
JAVA_VERSION="17"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${NC}  $1"; }
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}!${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; }

has() { command -v "$1" >/dev/null 2>&1; }

# make sure we're on a mac
if [[ "$OSTYPE" != "darwin"* ]]; then
    fail "this script is for macOS only"
    exit 1
fi

echo "setting up Byte Me dev environment on macOS $(sw_vers -productVersion)"
echo ""

# xcode cli tools -- needed for git and compilation
echo "--- xcode command line tools ---"
if ! xcode-select -p &>/dev/null; then
    info "installing xcode cli tools (a popup should appear)..."
    xcode-select --install
    echo "finish the install, then run this script again."
    exit 0
else
    ok "already installed"
fi

# homebrew
echo ""
echo "--- homebrew ---"
if ! has brew; then
    info "installing homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # apple silicon needs this
    if [[ $(uname -m) == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi

    ok "homebrew installed"
else
    ok "homebrew $(brew --version | head -n1)"
    brew update
fi

# git
echo ""
echo "--- git ---"
if ! has git; then
    brew install git
    ok "git installed"
else
    ok "$(git --version)"
fi

# node
echo ""
echo "--- node.js ---"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

if has nvm; then
    info "using nvm to install node $NODE_VERSION"
    nvm install $NODE_VERSION
    nvm use $NODE_VERSION
    nvm alias default $NODE_VERSION
    ok "node $(node --version) via nvm"
elif has node; then
    current=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$current" -ge "$NODE_VERSION" ]; then
        ok "node $(node --version)"
    else
        warn "node is too old (need v$NODE_VERSION+), upgrading..."
        brew install node@$NODE_VERSION
        brew link node@$NODE_VERSION --force --overwrite
    fi
else
    brew install node@$NODE_VERSION
    brew link node@$NODE_VERSION --force --overwrite
    ok "node installed"
fi

if ! has npm; then
    fail "npm not found, something went wrong with node install"
    exit 1
fi
ok "npm $(npm --version)"

# java
echo ""
echo "--- java $JAVA_VERSION ---"
if ! has java; then
    info "installing openjdk $JAVA_VERSION..."
    brew install openjdk@$JAVA_VERSION

    # symlink so /usr/bin/java can find it
    sudo ln -sfn /opt/homebrew/opt/openjdk@$JAVA_VERSION/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-$JAVA_VERSION.jdk 2>/dev/null || \
    sudo ln -sfn /usr/local/opt/openjdk@$JAVA_VERSION/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-$JAVA_VERSION.jdk 2>/dev/null || true

    if [[ $(uname -m) == "arm64" ]]; then
        JAVA_PATH="/opt/homebrew/opt/openjdk@$JAVA_VERSION"
    else
        JAVA_PATH="/usr/local/opt/openjdk@$JAVA_VERSION"
    fi

    echo "export PATH=\"$JAVA_PATH/bin:\$PATH\"" >> ~/.zshrc
    echo "export JAVA_HOME=\"$JAVA_PATH\"" >> ~/.zshrc
    export PATH="$JAVA_PATH/bin:$PATH"
    export JAVA_HOME="$JAVA_PATH"

    ok "java installed"
else
    ok "$(java -version 2>&1 | head -n1)"
fi

# maven
echo ""
echo "--- maven ---"
if ! has mvn; then
    brew install maven
    ok "maven installed"
else
    ok "$(mvn --version | head -n1)"
fi

# postgres
echo ""
echo "--- postgresql ---"
if ! has psql; then
    info "installing postgresql 16..."
    brew install postgresql@16
    brew services start postgresql@16
    ok "postgres installed and started"
else
    ok "$(psql --version)"
    # try to start it if its not running
    brew services start postgresql@16 2>/dev/null || true
fi

# done
echo ""
echo "-----------------------------"
echo "everything should be installed now"
echo ""
echo "  git:      $(git --version 2>/dev/null || echo 'missing')"
echo "  node:     $(node --version 2>/dev/null || echo 'missing')"
echo "  npm:      $(npm --version 2>/dev/null || echo 'missing')"
echo "  java:     $(java -version 2>&1 | head -n1 || echo 'missing')"
echo "  maven:    $(mvn --version 2>/dev/null | head -n1 || echo 'missing')"
echo "  postgres: $(psql --version 2>/dev/null || echo 'missing')"
echo ""
echo "next steps:"
echo "  1. restart your terminal (or run: source ~/.zshrc)"
echo "  2. create the database: createdb byte_me"
echo "  3. copy .env.example to backend/.env and fill in your values"
echo "  4. start backend:  cd backend && mvn spring-boot:run"
echo "  5. start frontend: cd frontend && npm install && npm run dev"
