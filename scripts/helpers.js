function groupBy(list, keyGetter) {
    const map = new Map();
    list.forEach((item) => {
        const key = keyGetter(item);
        if (!map.has(key)) {
            map.set(key, [item]);
        } else {
            map.get(key).push(item);
        }
    });
    return map;
}

var sort_by = function(field, reverse, primer){

   var key = primer ? 
       function(x) {return primer(x[field])} : 
       function(x) {return x[field]};

   reverse = !reverse ? 1 : -1;

   return function (a, b) {
       return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
     } 
}

// Helper function to bind data field to the local var.
function filter_function(val1, val2) {
    if (val2)
        return function(fieldVal) {
            return val1 <= fieldVal && fieldVal < val2;
        };
    else
        return function(fieldVal) {
            return val1 <= fieldVal;
        };
}

function exist(element, given) {
  return (element == given);
}