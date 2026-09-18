

export const productServiceDto = (data = []) => {
  return data?.map(item => ({
		guid: item?.guid,
		name: item?.Naimenovanie,
		tsena_za_ed: item?.TSena_za_ed,
		unit: item?.unit,
		discount: item?.Skidka,
		nds: item?.NDS,
		kolvo: item?.Kol_vo,
		article: item?.Artikul,
		summa: item?.Summa,
		comment: item?.kommentariy,
		status: item?.Status,
		tip: item?.Tip,
		currenies_id: item?.currenies_id,
		currency: item?.currenies_symbol || item?.currenies_kod,
		unit_name: item?.unit_name,
		product_and_service_id: item?.product_and_service_id,
		group_product_and_service_id: item?.group_product_and_service_id,
		product_and_service_group_id: item?.product_and_service_group_id,
		group_product_and_service_id_data: item?.group_product_and_service_id_data,
		unit_of_measurement_id: item?.units_of_measurement_id,
	}))
}