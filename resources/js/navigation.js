let navigator = null;

export const setNavigator = (nav) => {
  navigator = nav;
};

export const navigateTo = (path) => {
  if (navigator) navigator(path);
};