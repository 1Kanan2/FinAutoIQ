// lógica de crédito vehicular peruano — año bancario: 360 días / meses de 30

/*
 * Desarrollado por: Keyner Hancco
 * GitHub: https://github.com/1Kanan2
 * keynerivan@outlook.com
 */

export interface IFilaCronograma {
  numeroCuota: number;
  saldoInicial: number;
  interes: number;
  amortizacion: number;
  cuota: number;
  seguroVehicular: number;
  seguroDesgravamen: number;
  cuotaTotal: number;
  saldoFinal: number;
  tipoFila: 'normal' | 'gracia_total' | 'gracia_parcial';
}

export interface IParametrosCredito {
  capital: number;
  tem: number;
  plazoMeses: number;
  mesesGraciaTotal: number;
  mesesGraciaParcial: number;
  fechaInicio: Date;
  esCompraInteligente: boolean;
  montoBalon?: number;
  seguroVehicularPct: number;   // % mensual sobre precio vehículo (ej: 0.32)
  seguroDesgravamenPct: number; // % mensual sobre saldo deudor (ej: 0.069)
  precioVehiculo: number;
}

export interface IResultadoCredito {
  cronograma: IFilaCronograma[];
  van: number;
  tir: number;
  tcea: number;
  totalIntereses: number;
  totalPagado: number;
}

// TNA → TEM  (1 + tna/m)^(30/(360/m)) - 1
export function tnaATem(tna: number, periodoCapAnio: number): number {
  const m = periodoCapAnio;
  return Math.pow(1 + tna / m, 30 / (360 / m)) - 1;
}

// TEA → TEM  (1 + tea)^(30/360) - 1
export function teaATem(tea: number): number {
  return Math.pow(1 + tea, 30 / 360) - 1;
}

// TEM → TEA  (1 + tem)^(360/30) - 1
export function temATea(tem: number): number {
  return Math.pow(1 + tem, 360 / 30) - 1;
}

// TEM → TNA  m*((1+tem)^(1/n)-1)
export function temATna(tem: number, periodoCapAnio: number): number {
  const m = periodoCapAnio;
  const n = m / 12;
  return m * (Math.pow(1 + tem, 1 / n) - 1);
}

export function generarCronograma(params: IParametrosCredito): IFilaCronograma[] {
  const { capital, tem, plazoMeses, mesesGraciaTotal, mesesGraciaParcial, esCompraInteligente, montoBalon } = params;

  const cronograma: IFilaCronograma[] = [];
  let saldo = capital;
  let numeroCuota = 1;

  // gracia total: saldo crece con intereses
  for (let k = 0; k < mesesGraciaTotal; k++) {
    const saldoInicial = saldo;
    const interes = saldoInicial * tem;
    const saldoFinal = saldoInicial + interes;
    cronograma.push({
      numeroCuota, saldoInicial, interes,
      amortizacion: 0, cuota: 0,
      seguroVehicular: 0, seguroDesgravamen: 0, cuotaTotal: 0,
      saldoFinal, tipoFila: 'gracia_total',
    });
    saldo = saldoFinal;
    numeroCuota++;
  }

  // gracia parcial: solo intereses, saldo fijo
  for (let k = 0; k < mesesGraciaParcial; k++) {
    const saldoInicial = saldo;
    const interes = saldoInicial * tem;
    cronograma.push({
      numeroCuota, saldoInicial, interes,
      amortizacion: 0, cuota: interes,
      seguroVehicular: 0, seguroDesgravamen: 0, cuotaTotal: 0,
      saldoFinal: saldoInicial, tipoFila: 'gracia_parcial',
    });
    saldo = saldoInicial;
    numeroCuota++;
  }

  // cuotas normales (francés)
  const n = plazoMeses - mesesGraciaTotal - mesesGraciaParcial;
  if (n <= 0) return cronograma;

  const C = saldo;
  const i = tem;
  const factor = Math.pow(1 + i, n);

  let cuotaFija: number;
  if (esCompraInteligente && montoBalon !== undefined && montoBalon > 0) {
    // con balón: R = [C - V/(1+i)^n] * i(1+i)^n / ((1+i)^n - 1)
    cuotaFija = (C - montoBalon / factor) * ((i * factor) / (factor - 1));
  } else {
    cuotaFija = C * ((i * factor) / (factor - 1));
  }

  for (let k = 0; k < n; k++) {
    const saldoInicial = saldo;
    const interes = saldoInicial * i;
    const isUltimoPeriodo = k === n - 1;

    let amortizacion: number;
    let cuota: number;

    if (isUltimoPeriodo && !esCompraInteligente) {
      // cierre exacto, absorbe redondeo
      amortizacion = saldoInicial;
      cuota = interes + amortizacion;
    } else {
      amortizacion = cuotaFija - interes;
      cuota = cuotaFija;
    }

    const saldoFinal = Math.max(0, saldoInicial - amortizacion);
    cronograma.push({
      numeroCuota, saldoInicial, interes, amortizacion, cuota,
      seguroVehicular: 0, seguroDesgravamen: 0, cuotaTotal: 0,
      saldoFinal, tipoFila: 'normal',
    });
    saldo = saldoFinal;
    numeroCuota++;
  }

  return cronograma;
}

// VAN = Σ flujos[t] / (1+cok)^t
export function calcularVAN(flujos: number[], cok: number): number {
  return flujos.reduce((suma, flujo, t) => suma + flujo / Math.pow(1 + cok, t), 0);
}

// TIR mensual — Newton-Raphson (tol=1e-7, max 1000 iter)
export function calcularTIR(flujos: number[]): number {
  const TOLERANCIA = 1e-7;
  const MAX_ITER = 1000;
  let r = 0.1;

  for (let iter = 0; iter < MAX_ITER; iter++) {
    if (r <= -1) r = -0.9999;

    let f = 0;
    let df = 0;

    for (let t = 0; t < flujos.length; t++) {
      const descuento = Math.pow(1 + r, t);
      f += flujos[t] / descuento;
      df -= (t * flujos[t]) / (descuento * (1 + r));
    }

    if (Math.abs(df) < 1e-15) break;
    const delta = f / df;
    r -= delta;
    if (Math.abs(delta) < TOLERANCIA) break;
  }

  return r;
}

// TCEA anual = (1 + TIR_mensual)^12 - 1
export function calcularTCEA(valorRecibido: number, cuotas: number[], costosAdicionales: number): number {
  const flujos = [valorRecibido - costosAdicionales, ...cuotas.map((c) => -c)];
  return Math.pow(1 + calcularTIR(flujos), 12) - 1;
}

export function calcularCredito(
  params: IParametrosCredito,
  cok: number
): IResultadoCredito {
  const cronograma = generarCronograma(params);

  const segVehMensual = (params.seguroVehicularPct / 100) * params.precioVehiculo;

  // Enriquecer cada fila con seguros
  const cronogramaFinal = cronograma.map((fila) => {
    const segDesgrav = (params.seguroDesgravamenPct / 100) * fila.saldoInicial;
    return {
      ...fila,
      seguroVehicular: segVehMensual,
      seguroDesgravamen: segDesgrav,
      cuotaTotal: fila.cuota + segVehMensual + segDesgrav,
    };
  });

  const totalIntereses = cronograma.reduce((suma, fila) => suma + fila.interes, 0);
  const totalPagado = cronogramaFinal.reduce((suma, fila) => suma + fila.cuotaTotal, 0);

  // TIR/VAN: solo cuota francesa (sin seguros)
  const pagos = cronograma.map((c) => -c.cuota);
  if (params.esCompraInteligente && params.montoBalon && params.montoBalon > 0) {
    pagos[pagos.length - 1] -= params.montoBalon;
  }
  const flujos = [params.capital, ...pagos];

  // TCEA: cuota total (incluye seguros) — refleja costo real del crédito
  const pagosConSeguros = cronogramaFinal.map((c) => -c.cuotaTotal);
  if (params.esCompraInteligente && params.montoBalon && params.montoBalon > 0) {
    pagosConSeguros[pagosConSeguros.length - 1] -= params.montoBalon;
  }
  const flujosTCEA = [params.capital, ...pagosConSeguros];

  const van  = calcularVAN(flujos, cok);
  const tir  = calcularTIR(flujos);
  const tcea = Math.pow(1 + calcularTIR(flujosTCEA), 12) - 1;

  return { cronograma: cronogramaFinal, van, tir, tcea, totalIntereses, totalPagado };
}

// valores esperados:
// tnaATem(0.331, 360) → 0.1165937
// teaATem(0.45) → ~0.0317
// francés capital=1440000 tem=0.044030651 plazo=8 → cuota1=217454.11
