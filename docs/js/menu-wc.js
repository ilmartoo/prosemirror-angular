'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">prosemirror-angular documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-AppModule-3edaed7feb608f2b46ab754b0146793c5b202c0b5e29648a2081ee18dd8d62d2850944a5b66900c018e64d8fca844d6e426054596fef1ff876f7f86ace7546d0"' : 'data-bs-target="#xs-components-links-module-AppModule-3edaed7feb608f2b46ab754b0146793c5b202c0b5e29648a2081ee18dd8d62d2850944a5b66900c018e64d8fca844d6e426054596fef1ff876f7f86ace7546d0"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppModule-3edaed7feb608f2b46ab754b0146793c5b202c0b5e29648a2081ee18dd8d62d2850944a5b66900c018e64d8fca844d6e426054596fef1ff876f7f86ace7546d0"' :
                                            'id="xs-components-links-module-AppModule-3edaed7feb608f2b46ab754b0146793c5b202c0b5e29648a2081ee18dd8d62d2850944a5b66900c018e64d8fca844d6e426054596fef1ff876f7f86ace7546d0"' }>
                                            <li class="link">
                                                <a href="components/AppComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuImageItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuImageItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuIndentItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuIndentItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuLinkItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuLinkItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuListItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuListItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuMarkItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuMarkItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuNodeItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuNodeItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuRemoveLinkItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuRemoveLinkItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MenuSchemaItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MenuSchemaItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TextEditorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TextEditorComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/AncestorNodeList.html" data-type="entity-link" >AncestorNodeList</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});