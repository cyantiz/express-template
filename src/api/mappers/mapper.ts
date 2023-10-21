export interface Mapper<TViewModel, TDomainModel> {
  map(viewModel: TViewModel): TDomainModel;
}
