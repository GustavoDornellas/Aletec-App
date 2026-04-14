function getTrimmedValue(value) {
  return String(value ?? '').trim();
}

function getNumberValue(value) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return Number.parseFloat(value.replace(',', '.'));
  }

  return Number.NaN;
}

export function validateProduto(produto) {
  const errors = {};

  const nome = getTrimmedValue(produto.nome ?? produto.name);
  const pn = getTrimmedValue(produto.pn);
  const categoria = getTrimmedValue(produto.categoria ?? produto.category);
  const preco = getNumberValue(produto.preco ?? produto.price);
  const estoqueValue = produto.estoque ?? produto.stock;
  const estoque =
    estoqueValue === undefined || estoqueValue === null || estoqueValue === ''
      ? 0
      : getNumberValue(estoqueValue);

  if (!nome) {
    errors.nome = 'Informe o nome do produto.';
  }

  if (!pn) {
    errors.pn = 'Informe o modelo ou part number do produto.';
  }

  if (!categoria) {
    errors.category = 'Selecione uma categoria.';
  }

  if (!Number.isFinite(preco)) {
    errors.preco = 'Informe um preco valido.';
  } else if (preco <= 0) {
    errors.preco = 'O preco deve ser maior que zero.';
  }

  if (!Number.isFinite(estoque)) {
    errors.estoque = 'Informe um estoque valido.';
  } else if (estoque < 0) {
    errors.estoque = 'O estoque nao pode ser negativo.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
