class Auth {
  init = setfn => {
    this.setAllowedIn = setfn;
  };
  setAllowedIn = tf => {
    this.setAllowedIn(tf);
  };
}
export default new Auth();
