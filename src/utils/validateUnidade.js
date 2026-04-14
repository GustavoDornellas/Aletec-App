import { normalizeUnitStatus, UNIT_STATUS_OPTIONS } from '@/utils/produtoConstants';

export function validateUnidade(unidade) {
  const errors = {};
  const productId = String(unidade.productId ?? '').trim();
  const serial = String(unidade.sn ?? unidade.serial ?? '').trim();
  const quantity =
    typeof unidade.quantity === 'number'
      ? unidade.quantity
      : Number.parseInt(String(unidade.quantity ?? unidade.quantidade ?? '1'), 10);
  const status = normalizeUnitStatus(unidade.status);

  if (!productId) {
    errors.productId = 'Selecione um produto valido para cadastrar a unidade.';
  }

  if (!serial) {
    errors.sn = 'Informe o numero de serie.';
  }

  if (!Number.isFinite(quantity) || quantity < 1) {
    errors.quantity = 'A quantidade deve ser maior ou igual a 1.';
  }

  if (!UNIT_STATUS_OPTIONS.includes(status)) {
    errors.status = 'Selecione um status valido para a unidade.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
