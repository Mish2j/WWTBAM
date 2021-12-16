export const getJson = async (url) => {
  try {
    const res = await fetch(url);

    const data = await res.json();

    if (!res.ok) throw new Error(`Error: ${data.message} (${res.status})`);

    return data;
  } catch (error) {
    throw error;
  }
};

export const randomValFromR = (arr) => {
  let randomValue = arr[Math.floor(Math.random() * arr.length)];
  return randomValue;
};

export const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const randomUniqueMultipleElFromArr = (arr, uniqueElements, loops) => {
  const randomEl = randomValFromR(arr);
  while (uniqueElements.length !== loops) {
    if (!uniqueElements.includes(randomEl)) {
      uniqueElements.push(randomEl);
    } else {
      randomUniqueMultipleElFromArr(arr, uniqueElements, loops);
    }
  }
};

export const removeHTMLTags = (str) => {
  if (str === null || str === "") return false;
  return str.replace(/(<([^>]+)>)/gi, "");
};

export const getRandomNum = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const getArrayRandomInts = (maxInitNum, count) => {
  let maxNum = maxInitNum;
  let minNum = 1;
  let randomNums = [];

  if (count === 1) {
    randomNums.push(maxNum);
    return randomNums;
  }

  while (maxNum !== 0) {
    let randomNum = getRandomNum(minNum, maxNum);
    randomNums.push(randomNum);
    maxNum -= randomNum;
  }

  if (maxNum === 0 && randomNums.length > count) {
    return getArrayRandomInts(maxInitNum, count);
  }

  if (maxNum === 0 && randomNums.length < count) {
    const newR = new Array(count - randomNums.length);
    const fillNewR = newR.fill(0);

    const updatedRandomNums = [...randomNums, ...fillNewR];
    return updatedRandomNums;
  }

  return randomNums;
};
