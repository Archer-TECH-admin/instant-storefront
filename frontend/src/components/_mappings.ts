import {APP_NAME, CATCH_ALL, ComponentRegistry} from '@enonic/nextjs-adapter';
import PropsView from '@enonic/nextjs-adapter/views/PropsView';
import {commonQuery, commonVariables} from './queries/common';

import "@enonic/nextjs-adapter/baseMappings";
import ProductPage from './enonic/pages/ProductPage';
import ProductDetail from './enonic/parts/ProductDetail';

// You can set common query for all views here
ComponentRegistry.setCommonQuery([commonQuery, commonVariables]);

// Content type mappings



// Page mappings
ComponentRegistry.addPage(`${APP_NAME}:product`, { view: ProductPage });


// Layout mappings



// Part mappings
ComponentRegistry.addPart(`${APP_NAME}:product-detail`, { view: ProductDetail });


// Debug
ComponentRegistry.addContentType(CATCH_ALL, {
    view: PropsView
});
