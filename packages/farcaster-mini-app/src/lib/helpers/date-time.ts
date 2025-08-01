import moment from "moment";

export const fromNow = (date: string | Date, withoutSuffix = false) => {
  return moment(date).fromNow(withoutSuffix);
};

export const toNow = (date: string | Date, withoutSuffix = false) => {
  return moment(date).toNow(withoutSuffix);
};