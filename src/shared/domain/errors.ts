import { DomainError, DomainErrorType } from './domain-error';

export const notFound = (entity: string, id: string): DomainError =>
  new DomainError(
    `${entity.toUpperCase()}_NOT_FOUND`,
    `No se encontró ${ENTITY_LABELS[entity] ?? entity} ${id}.`,
    DomainErrorType.NOT_FOUND,
  );

const ENTITY_LABELS: Record<string, string> = {
  area: 'el área',
  reservation: 'la reserva',
  payment: 'el pago',
  user: 'el usuario',
};
