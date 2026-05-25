export const maskCurrency = (value: string) => {
  let v = value.replace(/\D/g, "");
  if (!v) return "";
  v = (parseInt(v) / 100).toFixed(2);
  v = v.replace(".", ",");
  v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
  return v;
};

export const unmaskCurrency = (value: string) => {
  if (!value) return "0";
  return value.replace(/\./g, "").replace(",", ".");
};
