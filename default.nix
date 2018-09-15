with import <nixpkgs> {};

stdenv.mkDerivation rec {
  name = "play-doh";
  env = buildEnv { name = name; paths = buildInputs; };
  buildInputs = [
    flow
    nodejs-10_x
  ];

  shellHook = ''
    export PATH="$PWD/node_modules/mocha/bin:$PATH"
    alias gst="git status"
    alias vim="nvim"
  '';
}
